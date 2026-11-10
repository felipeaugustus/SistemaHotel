export type Feedback = { type: 'success' | 'error'; message: string } | null

export default function Alert({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null

  return (
    <p role="alert" className={`alert alert-${feedback.type}`}>
      {feedback.message}
    </p>
  )
}
