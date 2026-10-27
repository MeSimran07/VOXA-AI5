import { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Presentations - Voxa AI",
  description: "Generate beautiful presentation slide decks from a single prompt using Voxa AI.",
  keywords: ["AI presentations", "slide generator", "Voxa AI", "AI tools", "pitch deck generator"],
}

export default function PresentationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
