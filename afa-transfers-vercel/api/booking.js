
import nodemailer from 'nodemailer';

export default async function handler(req, res){
  if(req.method!=='POST'){ res.status(405).json({ok:false}); return; }
  try{
    const {name,email,phone,pickup,dropoff,date,time,passengers,notes,flight} = req.body || {};
    if(!name||!pickup||!dropoff||!date){ res.status(400).json({ok:false,error:'missing_fields'}); return; }

    if(process.env.RESEND_API_KEY){
      const r = await fetch('https://api.resend.com/emails',{
        method:'POST',
        headers:{'Authorization':`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'AFA Transfers <noreply@afatransfer.lv>',
          to: [process.env.BOOKING_TO || process.env.SMTP_USER],
          subject: `AFA Transfers: Booking — ${date} (${name})`,
          html: `<h2>AFA Transfers — New booking request</h2>
            <ul>
              <li><b>Name:</b> ${name||'-'}</li>
              <li><b>Date:</b> ${date||'-'} ${time||''}</li>
              <li><b>Flight:</b> ${flight||'-'}</li>
              <li><b>Pickup:</b> ${pickup||'-'}</li>
              <li><b>Drop-off:</b> ${dropoff||'-'}</li>
              <li><b>Passengers:</b> ${passengers||'-'}</li>
              <li><b>Notes:</b> ${notes||'-'}</li>
              <li><b>Email:</b> ${email||'-'}</li>
              <li><b>Phone:</b> ${phone||'-'}</li>
            </ul>`
        })
      });
      const j = await r.json();
      if(j?.id){ res.status(200).json({ok:true}); return; }
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT||587),
      secure: String(process.env.SMTP_SECURE).toLowerCase()==='true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    await transporter.sendMail({
      from: { name:'AFA Transfers', address: process.env.SMTP_FROM || process.env.SMTP_USER },
      to: process.env.BOOKING_TO || process.env.SMTP_USER,
      subject: `AFA Transfers: Booking — ${date} (${name})`,
      replyTo: email || undefined,
      html: `<h2>AFA Transfers — New booking request</h2>
        <ul>
          <li><b>Name:</b> ${name||'-'}</li>
          <li><b>Date:</b> ${date||'-'} ${time||''}</li>
          <li><b>Flight:</b> ${flight||'-'}</li>
          <li><b>Pickup:</b> ${pickup||'-'}</li>
          <li><b>Drop-off:</b> ${dropoff||'-'}</li>
          <li><b>Passengers:</b> ${passengers||'-'}</li>
          <li><b>Notes:</b> ${notes||'-'}</li>
          <li><b>Email:</b> ${email||'-'}</li>
          <li><b>Phone:</b> ${phone||'-'}</li>
        </ul>`
    });
    res.status(200).json({ok:true});
  }catch(e){
    console.error(e); res.status(500).json({ok:false,error:'server_error'});
  }
}
