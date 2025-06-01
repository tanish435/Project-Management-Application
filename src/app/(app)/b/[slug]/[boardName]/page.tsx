'use client'
import BoardNavbar from '@/components/BoardNavbar';
import ListComponent from '@/components/ListComponent';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ApiResponse } from '@/utils/ApiResponse';
import axios, { AxiosError } from 'axios';
import { useParams } from 'next/navigation';
import {DragDropContext, Droppable} from '@hello-pangea/dnd'
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
  list: string
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
  const [hasInitialised, setHasInitialised] = useState<boolean>(false)

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

  // useEffect(() => {
  //   console.log("lst", lists);

  // }, [lists])
 

  function reorder<T>(list: T[], startIndex: number, endIndex: number) {
    const result = Array.from(list)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)

    return result
  }

  const onDragEnd = async(result: any) => {
    const {destination, source, type} = result

    if(!destination) {
      return;
    }

    // if dropped in the same position
    if(
      destination.droppableId === source.droppableId && 
      destination.index === source.index
    ) {
      return;
    }

    // User moves a list
    if(type === 'list') {
      const items = reorder(
        lists,
        source.index,
        destination.index
      ).map((item, index) => ({...item, position: index}))

      setLists(items)

      try {
        const movedList = items[destination.index]
        const res = await axios.patch(`/api/lists/updateListPosition/${boardData?._id}/${movedList._id}?pos=${destination.index}`);
        toast.success(res.data.message);
      } catch (err) {
        const axiosErr = err as AxiosError<ApiResponse>;
        console.error("Position update error:", axiosErr.response || axiosErr.message);
        toast.error("Failed to update list position", {
          description: axiosErr.response?.data.message || "Unknown error",
        });
      }
    }

    // User moves a card
    if(type === "card") {
      let newLists = [...lists]

      // Source and destination list
      const sourceList = newLists.find(list => list._id === source.droppableId)
      const destList = newLists.find(list => list._id === destination.droppableId)      

      if(!sourceList || !destList) {
        return;
      }

      // Check if cards exists on the source list
      if(!sourceList.cards) {
        sourceList.cards = []
      }

      // Check if cards exists on the destList
      if(!destList.cards) {
        destList.cards = []
      }

      // Moving the card in the same list
      if(source.droppableId === destination.droppableId) {
        const reorderedCards = reorder(
          sourceList.cards,
          source.index,
          destination.index
        )
        
        reorderedCards.forEach((card, index) => {
          card.position = index
        })

        
        sourceList.cards = reorderedCards
        
        setLists(newLists)

        try {
          const movedCard = reorderedCards[destination.index]
          const res = await axios.patch(`/api/cards/updateCardPosition/${sourceList._id}/${movedCard._id}`, {
            position: destination.index
          });
          toast.success(res.data.message);
        } catch (err) {
          const axiosErr = err as AxiosError<ApiResponse>;
          console.error("Position update error:", axiosErr.response || axiosErr.message);
          toast.error("Failed to update card position", {
            description: axiosErr.response?.data.message || "Unknown error",
          });
        }
      } else { // User moves the card to another list
        // Remove card from the source list

        const [movedCard] = sourceList.cards.splice(source.index, 1)
        
        // Assign the new listId to the moved card
        movedCard.list = destination.droppableId

        // Add card to destination list
        destList.cards.splice(destination.index, 0, movedCard)

        sourceList.cards.forEach((card, index) => {
          card.position = index
        })

        // Update the order for each card in the destination list
        destList.cards.forEach((card, index) => {
          card.position = index
        })

        setLists(newLists)

        try {
          const res = await axios.patch(`/api/cards/updateCardPosition/${destList._id}/${movedCard._id}`, {
            position: destination.index
          });
          toast.success(res.data.message);
        } catch (err) {
          const axiosErr = err as AxiosError<ApiResponse>;
          console.error("Position update error:", axiosErr.response || axiosErr.message);
          toast.error("Failed to update card position", {
            description: axiosErr.response?.data.message || "Unknown error",
          });
        }
      }
    }
  }

  return (
    <div className={`${bgColor} h-full`}>
      <BoardNavbar _id={boardData?._id as string} members={members as User[]} boardName={boardData?.name as string} />
      <ScrollArea className="h-max whitespace-nowrap overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId='lists' type='list' direction='horizontal'>
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref = {provided.innerRef}
                className='flex w-max space-x-4 p-4'
              >
                {lists?.length > 0 && lists.map((list) => (
                  <ListComponent boardMembers={members} listInfo={list} key={list._id} />
                ))}

                {provided.placeholder}
              </div>
            )}
            
              </Droppable>
        </DragDropContext>
        <ScrollBar orientation='horizontal' className="hidden" />
      </ScrollArea>
    </div >
  )
}

export default Board