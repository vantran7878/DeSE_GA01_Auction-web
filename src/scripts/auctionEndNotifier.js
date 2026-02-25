/**
 * Auction End Notifier
 * Script kiểm tra và gửi email thông báo khi đấu giá kết thúc
 */

import * as productModel from '../models/product.model.js';
import { sendMail } from '../utils/mailer.js';
import { notificationHanlders } from './notificationHandlers.js';

/**
 * Kiểm tra các đấu giá kết thúc và gửi email thông báo
 */
export async function checkAndNotifyEndedAuctions() {
  try {
    const endedAuctions = await productModel.getNewlyEndedAuctions();
    
    if (endedAuctions.length === 0) {
      return;
    }

    console.log(`📧 Found ${endedAuctions.length} ended auctions to notify`);

    for (const auction of endedAuctions) {
      try {
        const productUrl = `${process.env.BASE_URL || 'http://localhost:3005'}/products/detail?id=${auction.id}`;
        
        // Lọc ra các handler phù hợp với trạng thái của auction này
        const activeHandlers = notificationHanlders.filter(h => h.shouldHandle(auction));

        // Thực thi tất cả các thông báo phù hợp đồng thời
        await Promise.all(activeHandlers.map(handler => 
          handler.send(auction, sendMail, productUrl)
        ));

        // Đánh dấu đã gửi thông báo
        await productModel.markEndNotificationSent(auction.id);

      } catch (emailError) {
        console.error(`❌ Failed to send notification for product #${auction.id}:`, emailError);
      }
    }

  } catch (error) {
    console.error('❌ Error checking ended auctions:', error);
  }
}

/**
 * Khởi chạy job định kỳ
 * @param {number} intervalSeconds - Khoảng thời gian giữa các lần kiểm tra (giây)
 */
export function startAuctionEndNotifier(intervalSeconds = 30) {
  console.log(`🚀 Auction End Notifier started (checking every ${intervalSeconds} second(s))`);
  
  // Chạy ngay lần đầu
  checkAndNotifyEndedAuctions();
  
  // Sau đó chạy định kỳ
  setInterval(checkAndNotifyEndedAuctions, intervalSeconds * 1000);
}
