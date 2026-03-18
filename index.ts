"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core = require("@actions/core");
const axios_1 = require("axios");
const qs = require("querystring");

(async () => {
    const productId = core.getInput("product-id");
    // 쉼표로 구분된 ID들을 가져와서 배열(리스트)로 만듭니다.
    const scheduleIds = core.getInput("schedule-id").split(",").map(id => id.trim());
    const telegramToken = core.getInput("telegram-bot-token");
    const telegramChatId = core.getInput("telegram-chat-id");

    console.log(`감시 시작: 총 ${scheduleIds.length}개의 날짜를 확인합니다.`);

    // 각 날짜(scheduleId)마다 반복해서 확인합니다.
    for (const sId of scheduleIds) {
        try {
            const res = await axios_1.default({
                method: "POST",
                url: "https://ticket.melon.com/tktapi/product/seatGradeAvailableInfo.json",
                data: qs.stringify({
                    prodId: productId,
                    scheduleNo: sId,
                }),
            });

            const gradeList = res.data.summary;
            let totalAvailable = 0;
            let detailMessage = "";

            gradeList.forEach((grade: any) => {
                totalAvailable += grade.availableCnt;
                if (grade.availableCnt > 0) {
                    detailMessage += `\n- ${grade.gradeName}: ${grade.availableCnt}석`;
                }
            });

            console.log(`[ID: ${sId}] 잔여 좌석: ${totalAvailable}석`);

            if (totalAvailable > 0) {
                const ticketUrl = `https://ticket.melon.com/performance/index.htm?prodId=${productId}`;
                const alertText = `🚨 [티켓 발생!] ID: ${sId}\n총 ${totalAvailable}석 가능${detailMessage}\n\n지금 예매하세요: ${ticketUrl}`;
                
                await axios_1.default.post(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    chat_id: telegramChatId,
                    text: alertText,
                });
            }
            
            // 멜론 서버에 무리가 가지 않게 잠시 쉬어줍니다 (선택 사항)
            await new Promise(resolve => setTimeout(resolve, 1000)); 

        } catch (err) {
            console.error(`[ID: ${sId}] 확인 중 에러 발생:`, err.message);
        }
    }
})().catch((e) => {
    core.setFailed(e.message);
});
