'use client'
import BoardNavbar from '@/components/BoardNavbar';
import { ApiResponse } from '@/utils/ApiResponse';
import axios, { AxiosError } from 'axios';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';

interface User {
  _id: string,
  fullName: string,
  username: string;
  email: string;
  avatar: string;
  initials: string
}

interface Card {
  _id: string;
  name: string;
  description: string;
  position: number;
  dueDate: string;
  comments: number;
  checklists: number;
  attachments: number;
}

interface List {
  _id: string;
  name: string;
  position: number;
  board: string;
  createdAt: string;
  updatedAt: string;
  createdBy: User[];
  cards: Card[];
}

interface Board {
  _id: string
  name: string
  bgColor: string
  url: string
  admin: User[]
  members: User[]
  lists: List[]
  createdAt: string;
  updatedAt: string;
}

const Board = () => {
  const [boardData, setBoardData] = useState<Board | null>(null)
  const [lists, setLists] = useState<List[] | null>(null)
  const [bgColor, setBgColor] = useState("")
  const [cards, setCards] = useState<Card | null>(null)
  const [admin, setAdmin] = useState<User[] | null>(null)
  const [members, setMembers] = useState<User[] | null>(null)

  const [isBoardLoading, setIsBoardLoading] = useState<boolean>(false)

  const params = useParams<{ slug: string, boardName: string }>()

  useEffect(() => {
    const fetchBoardBySlug = async () => {
      try {
        setIsBoardLoading(true)
        const response = await axios.get(`/api/boards/getBoardBySlug/${params.slug}`)
        setBoardData(response.data.data);
        
      } catch (error) {
        console.log("Error fetching board");
        const axiosError = error as AxiosError<ApiResponse>
        const errMsg = axiosError.response?.data.message

        toast.error('Failed to fetch board info', {
          description: errMsg
        })
      } finally {
        setIsBoardLoading(false)
      }

    }

    fetchBoardBySlug()
  }, [])

  useEffect(() => {
    console.log("geifie", boardData);
    setAdmin(boardData?.admin as User[])
    setMembers(boardData?.members as User[])
    setLists(boardData?.lists as List[])
    setBgColor(boardData?.bgColor as string)
  }, [boardData])
  return (
    <div className={`${bgColor} h-full`}>
      <BoardNavbar _id={boardData?._id as string} members={members as User[]} boardName={boardData?.name as string}/>
    </div>
  )
}

export default Board