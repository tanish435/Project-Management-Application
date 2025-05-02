'use client'
import BoardNavbar from '@/components/BoardNavbar';
import ListComponent from '@/components/ListComponent';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ApiResponse } from '@/utils/ApiResponse';
import axios, { AxiosError } from 'axios';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, TouchSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import SortableListItem from '@/components/SortableListItem';

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
  slug: string;
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
  const [lists, setLists] = useState<List[]>([])
  const [bgColor, setBgColor] = useState("")
  const [cards, setCards] = useState<Card | null>(null)
  const [admin, setAdmin] = useState<User[]>([])
  const [members, setMembers] = useState<User[]>([])

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
    setLists(boardData?.lists || [])
    setBgColor(boardData?.bgColor as string)
  }, [boardData])

  useEffect(() => {
    console.log("lst", lists);

  }, [lists])

  // const handleDragEnd = async(event: DragEndEvent) => {
  //   const { active, over } = event;

  //   if (!over || active.id === over.id) {
  //     return;
  //   }

  //   setLists((lists) => {
  //     const oldIndex = lists.findIndex((list) => list._id === active.id);
  //     const newIndex = lists.findIndex((list) => list._id === over.id);

  //     const updatedLists = [...lists];
  //     const [movedItem] = updatedLists.splice(oldIndex, 1);
  //     updatedLists.splice(newIndex, 0, movedItem);

  //     const newOrderedLists = updatedLists.map((list, index) => ({
  //       ...list,
  //       position: index
  //     }));

  //     axios.patch(`/api/lists/updateListPosition/${boardData._id}/${active.id}?pos=${newIndex}`)
  //       .then((res) => {
  //         toast.success(res.data.message)
  //       }).catch((err: AxiosError<ApiResponse>) => {
  //         toast.error("Failed to update list position", {
  //           description: err.response?.data.message,
  //         });
  //       });

  //       return newOrderedLists
  //   });
  // };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
  
    if (!over || active.id === over.id || !boardData) return;
  
    const oldIndex = lists.findIndex((list) => list._id === active.id);
    const newIndex = lists.findIndex((list) => list._id === over.id);
  
    if (oldIndex === -1 || newIndex === -1) return;
  
    const updatedLists = [...lists];
    const [movedItem] = updatedLists.splice(oldIndex, 1);
    updatedLists.splice(newIndex, 0, movedItem);
  
    const newOrderedLists = updatedLists.map((list, index) => ({
      ...list,
      position: index,
    }));
  
    setLists(newOrderedLists);
  
    try {
      const res = await axios.patch(`/api/lists/updateListPosition/${boardData._id}/${active.id}?pos=${newIndex}`);
      toast.success(res.data.message);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiResponse>;
      console.error("Position update error:", axiosErr.response || axiosErr.message);
      toast.error("Failed to update list position", {
        description: axiosErr.response?.data.message || "Unknown error",
      });
    }
  };  

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  return (
    <div className={`${bgColor} h-full`}>
      <BoardNavbar _id={boardData?._id as string} members={members as User[]} boardName={boardData?.name as string} />
      <ScrollArea className="h-max whitespace-nowrap">
        {/* <DndContext sensors={sensors}> */}
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className='flex w-max space-x-4 p-4'>
            <SortableContext items={lists.map(list => list._id)} strategy={horizontalListSortingStrategy}>
              {lists?.length > 0 && lists.map((list) => (
                <SortableListItem key={list._id} id={list._id}>
                  {({listeners}) => <ListComponent boardMembers={members} listInfo={list} listeners={listeners} />}
                </SortableListItem>
              ))}
            </SortableContext>
          </div>
        </DndContext>
        <ScrollBar orientation='horizontal' className="hidden" />
      </ScrollArea>
    </div >
  )
}

export default Board