// routes/helpers/commentNotificationHandlers.js

export const commentNotificationHandlers = [
  // 1. Seller is replying to a question → notify all bidders & commenters
  {
    shouldHandle: (data) => data.isSellerReplying && data.notifyUsers.length > 0,
    send: async (data, sendMail) => {
      const { notifyUsers, product, content, productUrl, seller } = data;

      await Promise.all(notifyUsers.map(user =>
        sendMail({
          to: user.email,
          subject: `Seller answered a question on: ${product.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #667eea;">Seller Response on Product</h2>
              <p>Dear <strong>${user.fullname}</strong>,</p>
              <p>The seller has responded to a question on a product you're interested in:</p>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p><strong>Product:</strong> ${product.name}</p>
                <p><strong>Seller:</strong> ${seller.fullname}</p>
                <p><strong>Answer:</strong></p>
                <p style="background-color: white; padding: 15px; border-radius: 5px; border-left: 4px solid #667eea;">${content}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${productUrl}" style="display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  View Product
                </a>
              </div>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #888; font-size: 12px;">This is an automated message from Online Auction.</p>
            </div>
          `
        })
      ));
    }
  },

  // 2. Regular user posts a comment/question → notify seller
  {
    shouldHandle: (data) => !data.isSellerReplying && data.seller && data.seller.email,
    send: async (data, sendMail) => {
      const { product, commenter, content, productUrl, isReply } = data;
      const subject = isReply 
        ? `New reply on your product: ${product.name}` 
        : `New question about your product: ${product.name}`;

      await sendMail({
        to: data.seller.email,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">${isReply ? 'New Reply' : 'New Question'} on Your Product</h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <p><strong>Product:</strong> ${product.name}</p>
              <p><strong>From:</strong> ${commenter.fullname}</p>
              <p><strong>${isReply ? 'Reply' : 'Question'}:</strong></p>
              <p style="background-color: white; padding: 15px; border-radius: 5px;">${content}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${productUrl}" style="display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View Product & ${isReply ? 'Reply' : 'Answer'}
              </a>
            </div>
          </div>
        `
      });
    }
  }
];