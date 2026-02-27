// routes/helpers/bidNotificationHandlers.js
// OPTIMIZED for SOLID + DRY + YAGNI + KISS

export const bidNotificationHandlers = [
  // 1. Notify SELLER - New bid received
  {
    shouldHandle: (result) => true,
    send: async (result, sendMail, productUrl, productName) => {
      await sendMail({
        to: result.seller.email,
        subject: `💰 New bid on your product: ${productName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #72AEC8 0%, #5a9ab8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">New Bid Received!</h1>
            </div>
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Dear <strong>${result.seller.fullname}</strong>,</p>
              <p>Great news! Your product has received a new bid:</p>
              <div style="background-color: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #72AEC8;">
                <h3 style="margin: 0 0 15px 0; color: #333;">${productName}</h3>
                <p style="margin: 5px 0;"><strong>Bidder:</strong> ${result.currentBidder.fullname}</p>
                <p style="font-size: 28px; color: #72AEC8; margin: 5px 0; font-weight: bold;">
                  ${new Intl.NumberFormat('en-US').format(result.newCurrentPrice)} VND
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${productUrl}" style="display: inline-block; background: linear-gradient(135deg, #72AEC8 0%, #5a9ab8 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Product</a>
              </div>
            </div>
          </div>
        `
      });
    }
  },

  // 2. Notify CURRENT BIDDER (winning or just placed)
  {
    shouldHandle: (result) => true,
    send: async (result, sendMail, productUrl, productName) => {
      const isWinning = result.newHighestBidderId === result.currentBidderId;
      await sendMail({
        to: result.currentBidder.email,
        subject: isWinning ? `✅ You're winning: ${productName}` : `📊 Bid placed: ${productName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, ${isWinning ? '#28a745' : '#ffc107'} 0%, ${isWinning ? '#218838' : '#e0a800'} 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">${isWinning ? "You're Winning!" : "Bid Placed"}</h1>
            </div>
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Dear <strong>${result.currentBidder.fullname}</strong>,</p>
              <p>${isWinning 
                ? 'Congratulations! Your bid has been placed and you are currently the highest bidder!' 
                : 'Your bid has been placed. However, another bidder has a higher maximum bid.'}</p>
              <div style="background-color: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid ${isWinning ? '#28a745' : '#ffc107'};">
                <h3 style="margin: 0 0 15px 0; color: #333;">${productName}</h3>
                <p style="margin: 5px 0;"><strong>Current Price:</strong></p>
                <p style="font-size: 28px; color: ${isWinning ? '#28a745' : '#ffc107'}; margin: 5px 0; font-weight: bold;">
                  ${new Intl.NumberFormat('en-US').format(result.newCurrentPrice)} VND
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${productUrl}" style="display: inline-block; background: linear-gradient(135deg, #72AEC8 0%, #5a9ab8 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  View Auction
                </a>
              </div>
            </div>
          </div>
        `
      });
    }
  },

  // 3. Notify PREVIOUS BIDDER (outbid or price updated)
  {
    shouldHandle: (result) => !!result.previousHighestBidderId && result.previousHighestBidderId !== result.newHighestBidderId,
    send: async (result, sendMail, productUrl, productName) => {
      const wasOutbid = result.newHighestBidderId !== result.previousHighestBidderId;
      await sendMail({
        to: result.previousBidder.email,
        subject: wasOutbid ? `⚠️ You've been outbid: ${productName}` : `📊 Price updated: ${productName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, ${wasOutbid ? '#dc3545' : '#ffc107'} 0%, ${wasOutbid ? '#c82333' : '#e0a800'} 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">${wasOutbid ? "You've Been Outbid!" : "Price Updated"}</h1>
            </div>
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Dear <strong>${result.previousBidder.fullname}</strong>,</p>
              ${wasOutbid 
                ? `<p>Unfortunately, another bidder has placed a higher bid on the product you were winning:</p>`
                : `<p>Good news! You're still the highest bidder, but the current price has been updated due to a new bid:</p>`
              }
              <div style="background-color: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid ${wasOutbid ? '#dc3545' : '#ffc107'};">
                <h3 style="margin: 0 0 15px 0; color: #333;">${productName}</h3>
                ${!wasOutbid ? `
                  <p style="margin: 5px 0; color: #28a745;"><strong>✓ You're still winning!</strong></p>
                ` : ''}
                <p style="margin: 5px 0;"><strong>New Current Price:</strong></p>
                <p style="font-size: 28px; color: ${wasOutbid ? '#dc3545' : '#ffc107'}; margin: 5px 0; font-weight: bold;">
                  ${new Intl.NumberFormat('en-US').format(result.newCurrentPrice)} VND
                </p>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                  <i>Previous price: ${new Intl.NumberFormat('en-US').format(result.previousPrice)} VND</i>
                </p>
              </div>
              ${wasOutbid ? `
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <p style="margin: 0; color: #856404;"><strong>💡 Don't miss out!</strong> Place a new bid to regain the lead.</p>
                </div>
              ` : `
                <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <p style="margin: 0; color: #155724;"><strong>💡 Tip:</strong> Your automatic bidding is working! Consider increasing your max bid if you want more protection.</p>
                </div>
              `}
              <div style="text-align: center; margin: 30px 0;">
                <a href="${productUrl}" style="display: inline-block; background: linear-gradient(135deg, ${wasOutbid ? '#28a745' : '#72AEC8'} 0%, ${wasOutbid ? '#218838' : '#5a9ab8'} 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                  ${wasOutbid ? 'Place New Bid' : 'View Auction'}
                </a>
              </div>
            </div>
            <p style="color: #888; font-size: 12px; text-align: center; margin-top: 20px;">This is an automated message from Online Auction.</p>
          </div>
        `
      });
    }
  }
];