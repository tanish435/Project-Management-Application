'use client'

import React from 'react'
import BoardContent from '@/components/BoardContent'
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const Board = () => {
  const { slug } = useParams<{ slug: string }>()

  return (
    <LiveblocksProvider authEndpoint={'/api/liveblocks-auth'}>
      <RoomProvider id={slug} initialPresence={{ cursor: null }}>
        <ClientSideSuspense fallback={<Loader2 className='animate-spin' />}>
          <BoardContent />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  )
}

export default Board
