type SendEmailOptions = {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const resendApiKey = process.env.RESEND_API_KEY
  const emailFrom = process.env.EMAIL_FROM

  if (resendApiKey && emailFrom) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [to],
        subject,
        html,
        text,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')

      throw new Error(
        `Failed to send email: ${response.status}${errorBody ? ` ${errorBody}` : ''}`
      )
    }

    return { status: 'sent' as const }
  }

  console.info(
    [
      'Email delivery is not configured.',
      `To: ${to}`,
      `Subject: ${subject}`,
      text,
    ].join('\n')
  )
  return { status: 'logged' as const }
}
