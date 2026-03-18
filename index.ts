"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core = require("@actions/core");
const axios_1 = require("axios");
const qs = require("querystring");

(async () => {
    // 1. 필요한 정보 가져오기 (Secrets에서 관리)
    const productId = core.getInput("product-id");
    const scheduleId = core.getInput("schedule-id");
    const telegramToken = core.getInput("telegram-bot-token");
    const telegramChatId = core.getInput("telegram-chat-id");
    
    // 2. 멜론 서버에 '전체 잔여 좌석 정보' 요청
    const res = await axios_1.default({
        method: "POST",
        url: "https://ticket.melon.com/tktapi/product/seatGradeAvailableInfo.json",
        data: qs.stringify({
            prodId: productId,
            scheduleNo: scheduleId,
        }),
    });

    const gradeList = res.data.summary; // 각 등급별 좌석 정보 리스트
    let totalAvailable = 0;
    let detailMessage = "";

    // 3. 모든 등급의 좌석 수 합치기
    gradeList.forEach((grade: any) => {
        totalAvailable += grade.availableCnt;
        if (grade.availableCnt > 0) {
            detailMessage += `\n- ${grade.gradeName}: ${grade.availableCnt}석`;
        }
    });

    console.log(`현재 총 잔여 좌석: ${totalAvailable}석`);

    // 4. 자리가 1개라도 있으면 텔레그램으로 알림 발송
    if (totalAvailable > 0) {
        const ticketUrl = `https://ticket.melon.com/performance/index.htm?prodId=${productId}`;
        const alertText = `🚨 [티켓 발생!] 총 ${totalAvailable}석 가능${detailMessage}\n\n지금 예매하세요: ${ticketUrl}`;
        
        const telegramUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
        await axios_1.default.post(telegramUrl, {
            chat_id: telegramChatId,
            text: alertText,
        });
        console.log("텔레그램 알림 발송 완료!");
    }
})().catch((e) => {
    core.setFailed(e.message);
});
