'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useChat } from 'ai/react'

import { Chat } from '@/components/chat'
import { SideView } from '@/components/side-view'

// Simulate user ID
const userID = 'dummy-user-id'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const { messages, setMessages, input, setInput, append, handleInputChange, handleSubmit, data } = useChat({
    api: '/api/chat',
    body: { userID },
  })

  // For simplicity, we care only about the latest message that has a tool invocation
  const latestMessageWithToolInvocation = [...messages].reverse().find(message => message.toolInvocations && message.toolInvocations.length > 0)
  // Get the latest tool invocation
  const latestToolInvocation = latestMessageWithToolInvocation?.toolInvocations?.[0]

  const clearMessages = () => {
    setMessages([]);
  };

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <main className="flex min-h-screen max-h-screen">
      <div className="fixed top-0 left-0 right-0 py-4 pl-8">
        <Image src="/logo.svg" alt="logo" width={30} height={30} />
      </div>
      <div className="flex-1 flex space-x-8 w-full pt-16 pb-8 px-4">
        <Chat
          messages={messages}
          append={append}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          setInput={setInput}
          clearMessages={clearMessages}
        />
        <SideView toolInvocation={latestToolInvocation} data={data} />
      </div>
    </main>
  )
}
