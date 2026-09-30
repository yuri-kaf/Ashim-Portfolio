---
title: "eSewa, Khalti, Fonepay or ConnectIPS: Which Payment Gateway in Nepal Should Your Website Use?"
slug: "esewa-khalti-fonepay-connectips-website-payments"
seoTitle: "Payment Gateway in Nepal: eSewa vs Khalti vs Fonepay"
metaDescription: "eSewa, Khalti, Fonepay or ConnectIPS? A designer's guide to picking a payment gateway in Nepal and building a checkout your customers actually finish."
excerpt: "What eSewa, Khalti, Fonepay and ConnectIPS actually are, what each asks of merchants, and how to design a checkout that doesn't lose Nepali customers at the last step."
categoryId: "design"
tags: ["payment gateway", "esewa", "khalti", "fonepay", "connectips", "checkout design", "e-commerce nepal"]
readTime: "10 min"
---
Almost every online-shop brief I get in Kathmandu has the same line near the bottom: "Payment: eSewa, Khalti." It's usually the last item on the list and the one that gets the least thought. Then the site launches, and the owner wonders why customers still message on Facebook asking for a QR.

The payment step is the one place where someone has already decided to buy. Losing them there is the most expensive drop-off a shop can have. This is a designer's look at choosing a payment gateway in Nepal: what each option actually is, what you need before you can apply, and how to design the checkout so people finish it.

## Four names, three different kinds of payment

Owners often list eSewa, Khalti, Fonepay and ConnectIPS as if they were four brands of the same thing. They aren't, and the difference changes how your checkout should work.

### eSewa and Khalti are wallets

eSewa and Khalti are digital wallets. The customer holds a balance in the app, or pays from a bank account linked to it. eSewa says it has [more than 10.8 million users](https://blog.esewa.com.np/esewa-17th-anniversary). Both run a payment gateway for websites: the customer is sent to eSewa or Khalti to log in and confirm, then brought back to your site.

The practical difference between eSewa and Khalti at checkout is what sits behind the button. According to [Khalti's merchant page](https://khalti.com/payment-gateway/), its gateway accepts the Khalti wallet, e-banking, mobile banking, SCT cards and ConnectIPS. So adding Khalti can quietly mean adding several bank methods as well.

### Fonepay is a QR network that runs through banks

Most people know Fonepay as the QR stand on a shop counter. The customer scans it with their bank's mobile banking app or a wallet. [Fonepay says](https://fonepay.com/faqs) its QR works across 64 banks and financial institutions, wallets included, and it has an online version for websites called Checkout by Fonepay.

QR is not a niche habit any more. In one month, mid-March to mid-April 2026, Nepal Rastra Bank data showed [54.64 million QR payments worth Rs 153.47 billion](https://thehimalayantimes.com/business/qr-payments-mobile-banking-surge-as-nepal-logs-rs-852bn-in-digital-transactions-in-one-month). Your customers already know how to scan.

### ConnectIPS pays straight from a bank account

[ConnectIPS](https://connectips.com/index.php/faqs) is run by Nepal Clearing House Limited, and it moves money directly from the customer's bank account to yours. There's no wallet to top up. It already sits behind a lot of government, tax and share-market payments, so someone who has paid for those online may have it set up already.

The customer needs a connectIPS login linked to an account at a member bank. That's more setup than a wallet, which is why it tends to suit larger, planned payments rather than impulse buys.

### Cash on delivery is still a payment method

It isn't a gateway, but for a lot of first-time buyers it is still the default, so the design should treat it as a real option.

## eSewa vs Khalti vs Fonepay vs ConnectIPS at a glance

| Option | Type | Best for | What the customer needs | Notes |
|---|---|---|---|---|
| eSewa | Digital wallet with a payment gateway | Everyday online shops, repeat local buyers | An eSewa account with balance or a linked bank | Customer confirms on eSewa, then returns to your site |
| Khalti | Digital wallet with a multi-method gateway | Shops that want one integration covering wallet and bank payments | A Khalti account, or supported e-banking, mobile banking, SCT card or ConnectIPS | Merchant requirements are published; WooCommerce plugin available |
| Fonepay | Interbank QR network | Customers who pay from bank apps; shops already using a Fonepay QR | A bank or wallet app that supports Fonepay QR | Set up through your bank; online checkout available |
| ConnectIPS | Interbank payment system run by NCHL | Larger orders, B2B, bookings and fees | A connectIPS login linked to a member bank account | Merchant is listed through their bank |
| Cash on delivery | Offline | First-time buyers, people who don't pay online yet | Cash at the door | Costs you in refused orders and cash handling |
| Bank card gateway | Card gateway run by a bank | Tourism, export, foreign customers | A card the bank's gateway supports | Apply through the bank; accepted cards vary |

I've left fees out on purpose. They vary by provider and by business, and they're quoted when you apply. Don't plan around a rate you read in a blog post, including this one.

## Start with how your customers already pay you

Customers don't think in gateways. They think about the app that's already on their phone, and whether it has money in it.

So before choosing, look at how people pay you now. If your shop QR gets scanned all day from bank apps, Fonepay belongs on the website. If customers send eSewa transfers after chatting on Messenger, eSewa goes first. If you sell to businesses that pay invoices from a company account, ConnectIPS matters more than any wallet.

Most small shops end up with two or three options. That's fine. Eight logos is not.

## What each provider asks for

The paperwork is where launch dates slip. Start it while the design is still being worked on, not the week before you go live.

- **Khalti** publishes its list on the [payment gateway page](https://khalti.com/payment-gateway/). A merchant needs a company registration certificate, PAN/VAT certificate, latest tax clearance and a logo, and has to be registered with an institution recognised by the government of Nepal. Khalti says it charges no annual maintenance fee and nothing to settle funds to your bank. There is a one-time API charge plus a charge per transaction, and those rates aren't published. It also has a [WooCommerce plugin](https://github.com/khalti/khalti-woocommerce).
- **eSewa** onboards businesses through a merchant account and a verification process. Ask eSewa for the current document list and rates before you plan around them.
- **Fonepay** is set up through your bank. Its FAQ points merchants to their own bank for the QR, and to the bank or Fonepay's team for online checkout.
- **ConnectIPS** also goes through your bank, which lists your account as a creditor so customers can pay you through the system.

Your developer doesn't have to wait for approval. eSewa and Khalti both publish developer documentation with test environments, so the checkout can be built and tested before the live keys arrive.

## Designing a checkout that doesn't lose people

This is the part owners skip, and it's where I spend the most time when a shop comes in as a [web design project](/services/web-design).

### Show the logos people recognise

People scan the checkout for the logo of the app they use. A line of grey text saying "Digital payment" makes them hunt. Use the real marks, big enough to recognise at a glance on a phone, in the order your customers use them most.

Only show options that work today. A greyed-out logo marked "coming soon" tells people the shop isn't finished.

### Give desktop a QR and mobile a button

Most customers in Nepal browse on phones. There are [32.4 million mobile connections](https://datareportal.com/reports/digital-2026-nepal), about 109% of the population. The catch is that nobody can scan a QR code that's on their own screen.

So the checkout should behave differently by device. On a laptop, a QR the customer scans with their phone is often the quickest route. On a phone, the button should hand over to the eSewa, Khalti or bank flow and bring them back afterwards. Depending on the provider, that might open the app or a login page. Test it on a mid-range Android, once with the app installed and once without, because those are two different journeys.

Plan for a slow return trip too. Mobile data is still [slow and patchy outside the cities](https://kathmandupost.com/science-technology/2026/04/14/4g-keeps-growing-fast-in-nepal-while-users-still-face-slow-speeds-and-patchy-coverage), so the page a customer lands on after paying should say "Checking your payment" and wait, not throw an error after five seconds.

### Keep cash on delivery, and be straight about it

Cash on delivery costs you something: refused parcels, riders carrying cash, orders placed on a whim. That's a reason to manage it, not to hide it.

If COD has a fee or only covers certain areas, say so on the product page or in the cart, not on the last screen. If you'd rather people paid online, give them a reason in plain words.

### Confirm the order where people read their messages

The confirmation page should show the order number, the amount paid and by which method, what happens next, and a phone number that someone answers. Then send the same details as a message.

Email on its own gets missed. SMS reaches every phone. Viber and WhatsApp are where a lot of customers actually talk to shops. Don't rely on a single channel, though. In September 2025, [26 unregistered platforms including WhatsApp and Facebook were blocked](https://kathmandupost.com/national/2025/09/04/nepal-bans-facebook-and-other-major-social-media-platforms-over-non-compliance) for about five days, while Viber, which was registered, stayed up. A shop confirming orders only on WhatsApp lost that channel for the week.

### Plan for "payment failed, but my money was deducted"

Every shop gets this message eventually. The customer paid, their app shows the deduction, and your site says the payment failed. Usually the connection dropped on the way back to your site, or the payment is still being processed.

Here's what keeps it from turning into an angry phone call:

1. **Check before you say "failed".** Both eSewa and Khalti document a way for your site to ask for a payment's status ([eSewa's docs](https://developer.esewa.com.np/pages/Epay), [Khalti's docs](https://docs.khalti.com/khalti-epayment/)). Khalti's guidance is to treat only a "Completed" status as a success.
2. **Show a pending state, not an error.** "We're confirming your payment, this can take a few minutes" is honest. "Payment failed" when it hasn't failed is not.
3. **Tell the customer exactly what to do**, on the page itself. Something like:

> If money has left your account but this page says the payment didn't go through, please don't pay again. Send your order number and the transaction ID from your eSewa, Khalti or bank app to us on Viber at [your Viber number]. We'll check it with the provider and reply today.

Someone on your side then has to check the merchant dashboard every day and match payments to orders. A checkout is only as reliable as the person reconciling it.

## Foreign customers need a card gateway

Trekking agencies, hotels, handicraft exporters and anyone selling abroad will hit a wall with wallets. eSewa, Khalti and ConnectIPS are built for people with Nepali accounts.

For foreign cards, Nepali banks run card payment gateways. Himalayan Bank's, for example, accepts Visa, Mastercard, Amex and UnionPay. Nabil Bank's accepts Visa, Mastercard and UnionPay cards issued in Nepal or abroad. You apply through the bank, and the requirements and charges are theirs to quote.

There's one narrower exception. [Fonepay says](https://fonepay.com/blogs/upi-in-nepal) Indian visitors can pay Fonepay merchant QR codes with UPI apps, but that's for QR at the point of sale, not a website checkout.

A site for foreign customers also needs a different checkout order. Put cards first, and show the price in the currency the card will be charged in, right next to the pay button. A tourist from Germany doesn't know what eSewa is, and a row of unfamiliar logos looks like the wrong page.

## A sensible starting setup

For a small shop selling inside Nepal, this is roughly where I'd start:

- One gateway that covers a wallet and bank methods, such as Khalti's, or eSewa if that's what your customers use most
- Fonepay, if you already have a Fonepay QR through your bank
- Cash on delivery, with the terms written clearly
- ConnectIPS, if your orders are large or your buyers are businesses
- A bank card gateway, only if you have foreign customers

Your website platform affects how easy each of these is to add. On WooCommerce, Khalti integration starts from its official plugin. On a custom build, each gateway is its own piece of integration work. I've written separately about [choosing between a static, WordPress or custom-built site](/blog/static-wordpress-or-custom-website-nepal), which is worth reading before you commit.

If the checkout on an existing site is the problem, fixing it is usually one of the smaller UX jobs with the most direct effect on sales. My post on [what UI/UX costs in Nepal](/blog/ui-ux-in-nepal-what-it-actually-costs) has the typical ranges.

## Questions owners ask about payment gateways in Nepal

### Is eSewa or Khalti better for a small online shop?

Neither wins across the board. Look at how your current customers pay you and start with that one. Khalti's gateway covers its wallet plus several bank methods in one integration, which helps if you only want to build one. Many shops end up offering both.

### Do I need a registered company to accept Khalti?

For the payment gateway, plan on it. Khalti's published requirements include a company registration certificate, PAN/VAT certificate and latest tax clearance, and it says merchants must be registered with a government-recognised institution. If your business is registered in another form, ask Khalti directly whether it qualifies.

### Can foreign customers pay on a Nepali website?

Yes, through a card payment gateway from a Nepali bank. Wallets and ConnectIPS are built for people with Nepali accounts, so a tourism or export business needs cards as well. Himalayan Bank and Nabil Bank are two examples of banks whose gateways accept international cards.

### Should I still offer cash on delivery?

For most shops selling to first-time buyers, yes. Removing it rarely turns cash buyers into online payers. More often it just loses the order. Make the terms clear, and give people a real reason to pay online instead.

If you're planning an online shop, or your checkout is quietly losing orders, [send over what you have](/contact) and we'll work out where people are dropping off.
