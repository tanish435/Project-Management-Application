'use client'

import React from 'react'
import BoardContent from '@/components/BoardContent'
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { useParams } from 'next/navigation';

const Board = () => {
  const {slug} = useParams<{slug: string}>()

  return (
    <LiveblocksProvider authEndpoint={'/api/liveblocks-auth'}>
      <RoomProvider id={slug} initialPresence={{ cursor: null }}>
          <BoardContent />
      </RoomProvider>
    </LiveblocksProvider>
  )
}

export default Board
