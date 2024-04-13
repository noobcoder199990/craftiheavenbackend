var aws = require("aws-sdk");
const log = require("../logger");
var ses = new aws.SES({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});
const header = `<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'/><meta http-equiv='X-UA-Compatible' content='IE=edge'/><meta name='viewport' content='width=device-width, initial-scale=1.0'/><title>Payment Email</title><style>html,body{height:100%;width:100%;padding:0;margin:0}</style></head><body style='background-color: #fff; color: #2F4858; '><div style='color: #1890ff; font-size: 35px; padding: 20px 0; width: 100%;'><div style='border-bottom: 4px #5e72e4 solid; padding: 0 0 10px 10px; margin: 0 20px;'> 
    
<span style='padding: 20px; font-size: 20px;'><strong>Payment has been initiated</strong></span></div></div>`;

function send(email, subject, data, dataType, source) {
  log.debug(email);
  let body = {};
  if (dataType === "HTML")
    body = {
      Html: {
        Data: data,
      },
    };
  else if (dataType === "TEXT")
    body = {
      Text: {
        Data: data,
      },
    };
  var params = {
    Source: source,
    Destination: {
      ToAddresses: email,
    },
    Message: {
      Subject: {
        Data: subject,
      },
      Body: body,
    },
    ConfigurationSetName: "email",
  };
  log.debug(params);
  return ses.sendEmail(params).promise((e) => log.debug(e));
}
function paymentmail(user, header, orderdetail) {
  const url = `${process.env.APP_URL}/login`;
  return `
    ${header}
    <div style="padding: 20px; font-size: 20px;"><div style="margin-top: 30px;">
            <p>Hi </p>
            <p>You have order from  ${user.email} . Please use following credentials to login.</p>
            <div>
                <p><strong>Email:</strong> <span>${user.email}</p>
                </div>
            <p>Regards,</p>
            <p>Team Craftiheaven</p>
            </div>
        </html>
    `;
}

module.exports = async function inviteUserEmail(toAddress, user, orderdetail) {
  try {
    let data = paymentmail(user, header, orderdetail);
    await send(
      toAddress,
      "You have order",
      data,
      "HTML",
      "craftiheaven@gmail.com"
    );
  } catch (err) {
    console.log(err, "paymentemail->73");
  }
};
