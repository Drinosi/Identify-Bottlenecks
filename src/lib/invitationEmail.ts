import { sendEmail } from '@/lib/email'

type InvitationEmailOptions = {
  to: string
  organizationName: string
  inviterName: string
  role: string
  inviteUrl: string
}

export function sendInvitationEmail({
  to,
  organizationName,
  inviterName,
  role,
  inviteUrl,
}: InvitationEmailOptions) {
  const description = `${inviterName} invited you to join ${organizationName} on Bottlenecks with the ${role} role.`

  return sendEmail({
    to,
    subject: `You're invited to join ${organizationName.replace(/[\r\n]/g, ' ')} on Bottlenecks`,
    text: [
      description,
      'Review and accept your invitation:',
      inviteUrl,
      `Sign in or create an account using ${to}. This invitation expires in 7 days.`,
      'If you weren’t expecting this invitation, you can ignore this email.',
    ].join('\n\n'),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <p style="color: #6d28d9; font-weight: 600;">Bottlenecks</p>
        <h1 style="font-size: 24px;">Join ${escapeHtml(organizationName)}</h1>
        <p>${escapeHtml(description)}</p>
        <p><a href="${escapeHtml(inviteUrl)}" style="display: inline-block; background: #6d28d9; color: #ffffff; padding: 12px 20px; border-radius: 10px; text-decoration: none;">Review invitation</a></p>
        <p>Sign in or create an account using <strong>${escapeHtml(to)}</strong>. This invitation expires in 7 days.</p>
        <p>If the button doesn’t work, open this link:</p>
        <p><a href="${escapeHtml(inviteUrl)}">${escapeHtml(inviteUrl)}</a></p>
        <p>If you weren’t expecting this invitation, you can ignore this email.</p>
      </div>
    `,
  })
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[character]
  })
}
