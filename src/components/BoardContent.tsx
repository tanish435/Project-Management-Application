import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useMutation, useRoom, useStorage, useSelf, useOthers } from "@liveblocks/react";
import BoardNavbar from "./BoardNavbar";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import ListComponent from "./ListComponent";
import { Lson, LiveList, LiveObject } from '@liveblocks/client';
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import axios, { AxiosError } from "axios";
import { ApiResponse } from "@/utils/ApiResponse";
import { toast } from "sonner";
import { Button } from "./ui/button";
import CreateListButton from "./CreateListButton";
import { Board, Card, CardLson, List, ListLson, User, UserLson } from "@/types/interface";

const BoardContent = () => {
  const [boardData, setBoardData] = useState<Board | null>(null)
  const [bgColor, setBgColor] = useState("")
  const [admin, setAdmin] = useState<User[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [hasInitialised, setHasInitialised] = useState<boolean>(false)
  const [isBoardLoading, setIsBoardLoading] = useState<boolean>(false)
  const [isStorageSyncing, setIsStorageSyncing] = useState<boolean>(false)
  const [lastBoardFetch, setLastBoardFetch] = useState<number>(0)
  
  // Add fallback state to prevent board disappearing
  const [fallbackLists, setFallbackLists] = useState<List[] | null>(null)

  const params = useParams<{ slug: string, boardName: string }>()
  const room = useRoom()
  const self = useSelf()
  const others = useOthers()

  // Track if this is the first user in the room
  const isFirstUser = others.length === 0
  const previousUsersCount = useRef(0)

  const lists = useStorage((root) => root.lists as List[] | null);
  const lastSyncTimestamp = useStorage((root) => root.lastSyncTimestamp as number | null);
  const syncVersion = useStorage((root) => root.syncVersion as number | null);

  // Update fallback when lists are available
  useEffect(() => {
    if (lists && lists.length > 0) {
      setFallbackLists(lists);
    }
  }, [lists]);

  // Use lists from storage if available, otherwise fallback
  const displayLists = lists || fallbackLists;

  const fetchBoardBySlug = async (forceRefresh = false) => {
    try {
      setIsBoardLoading(true)
      const response = await axios.get(`/api/boards/getBoardBySlug/${params.slug}`)
      const fetchedBoard = response.data.data

      setBoardData(fetchedBoard)
      setLastBoardFetch(Date.now())

      // Update fallback lists when board data is fetched
      if (fetchedBoard.lists) {
        setFallbackLists(fetchedBoard.lists);
      }

      return fetchedBoard
    } catch (error) {
      console.log("Error fetching board");
      const axiosError = error as AxiosError<ApiResponse>
      const errMsg = axiosError.response?.data.message

      toast.error('Failed to fetch board info', {
        description: errMsg
      })
      return null
    } finally {
      setIsBoardLoading(false)
    }
  }

  // Initial board fetch
  useEffect(() => {
    fetchBoardBySlug()
  }, [params.slug])

  // Monitor user count changes and refresh storage when new users join
  useEffect(() => {
    const currentUsersCount = others.length + 1 // +1 for self

    // If a new user joins and we have existing storage, check if we need to refresh
    if (currentUsersCount > previousUsersCount.current && lists && lastSyncTimestamp) {
      const timeSinceLastSync = Date.now() - lastSyncTimestamp
      const timeSinceLastFetch = Date.now() - lastBoardFetch

      // Refresh storage if it's been more than 5 minutes since last sync
      // or if there's a significant time gap
      if (timeSinceLastSync > 5 * 60 * 1000 || timeSinceLastFetch > 2 * 60 * 1000) {
        console.log('New user joined, refreshing storage with fresh data')
        refreshStorageWithFreshData()
      }
    }

    previousUsersCount.current = currentUsersCount
  }, [others.length, lists, lastSyncTimestamp, lastBoardFetch])

  const refreshStorageWithFreshData = async () => {
    if (isStorageSyncing) return

    setIsStorageSyncing(true)
    try {
      const freshBoard = await fetchBoardBySlug(true)
      if (freshBoard) {
        await forceReinitializeStorage(freshBoard)
        toast.success('Board data synchronized with latest changes')
      }
    } catch (error) {
      console.error('Failed to refresh storage:', error)
      toast.error('Failed to sync with latest changes')
    } finally {
      setIsStorageSyncing(false)
    }
  }

  const createLiveObjectsFromBoard = (board: Board) => {
    return new LiveList(
      board.lists.map((list) =>
        new LiveObject({
          _id: list._id,
          name: list.name,
          position: list.position,
          board: list.board,
          createdAt: list.createdAt,
          updatedAt: list.updatedAt,
          createdBy: new LiveList(
            list.createdBy.map((user) =>
              new LiveObject({
                _id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                initials: user.initials,
              })
            )
          ),
          cards: new LiveList(
            list.cards.map((card) =>
              new LiveObject({
                _id: card._id,
                name: card.name,
                description: card.description,
                slug: card.slug,
                list: card.list,
                position: card.position,
                dueDate: card.dueDate,
                members: new LiveList(
                  card.members?.map((user) =>
                    new LiveObject({
                      _id: user._id,
                      fullName: user.fullName,
                      username: user.username,
                      email: user.email,
                      avatar: user.avatar,
                      initials: user.initials,
                    })
                  ) ?? []
                ),
                comments: card.comments,
                checklists: card.checklists,
                attachments: card.attachments,
              })
            )
          ),
        })
      )
    );
  }

  const initializeStorage = useMutation(
    ({ storage }, board: Board) => {
      const liveLists = createLiveObjectsFromBoard(board)
      storage.set('lists', liveLists)
      storage.set('lastSyncTimestamp', Date.now())
      storage.set('syncVersion', 1)
    },
    []
  );

  const forceReinitializeStorage = useMutation(
    ({ storage }, board: Board) => {
      const liveLists = createLiveObjectsFromBoard(board)
      storage.set('lists', liveLists)
      storage.set('lastSyncTimestamp', Date.now())
      storage.set('syncVersion', (syncVersion || 0) + 1)
    },
    [syncVersion]
  );

  const updateSyncTimestamp = useMutation(
    ({ storage }) => {
      storage.set('lastSyncTimestamp', Date.now())
    },
    []
  );

  useEffect(() => {
    const setup = async () => {
      if (!boardData || isBoardLoading || hasInitialised) return;

      const storage = await room.getStorage();
      const existingLists = storage.root.get("lists")
      const existingTimestamp = storage.root.get("lastSyncTimestamp")

      // Initialize storage if it doesn't exist
      if (existingLists == null) {
        console.log('Initializing storage for the first time')
        initializeStorage(boardData);
      } else if (isFirstUser && existingTimestamp) {
        const storedTimestamp = Number(existingTimestamp);

        if (!isNaN(storedTimestamp)) {
          const timeSinceLastSync = Date.now() - storedTimestamp;

          if (timeSinceLastSync > 10 * 60 * 1000) { // 10 minutes
            console.log('First user detected, refreshing stale storage');
            forceReinitializeStorage(boardData);
          }
        }
      }

      setMembers(boardData.members);
      setHasInitialised(true);
    };

    setup();
  }, [boardData, isBoardLoading, initializeStorage, forceReinitializeStorage, room, hasInitialised, isFirstUser]);

  useEffect(() => {
    setAdmin(boardData?.admin as User[])
    setBgColor(boardData?.bgColor as string)
  }, [boardData])

  const onDragEnd = useMutation(
    async ({ storage }, result: DropResult) => {
      const { destination, source, type } = result;

      if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
        return;
      }

      const liveLists = storage.get('lists') as LiveList<LiveObject<ListLson>>;

      // Store original state for rollback
      const originalState = {
        sourceIndex: source.index,
        destIndex: destination.index,
        type: type
      }

      try {
        if (type === 'list') {
          // Optimistically update Liveblocks
          liveLists.move(source.index, destination.index);
          liveLists.toArray().forEach((list, index) => {
            list.set('position', index);
          });

          // Sync with backend
          const movedList = liveLists.get(destination.index);
          const res = await axios.patch(
            `/api/lists/updateListPosition/${boardData?._id}/${movedList?.get('_id')}?pos=${destination.index}`
          );

          // Update sync timestamp on success
          updateSyncTimestamp()
          toast.success(res.data.message);

        } else if (type === 'card') {
          const sourceList = liveLists.find((list) => list.get('_id') === source.droppableId);
          const destList = liveLists.find((list) => list.get('_id') === destination.droppableId);

          if (!sourceList || !destList) return;

          const sourceCards = sourceList.get('cards') as LiveList<LiveObject<CardLson>>;
          const destCards = destList.get('cards') as LiveList<LiveObject<CardLson>>;

          if (source.droppableId === destination.droppableId) {
            // Same list movement
            sourceCards.move(source.index, destination.index);
            sourceCards.toArray().forEach((card, index) => {
              card.set('position', index);
            });

            const movedCard = sourceCards.get(destination.index);
            const res = await axios.patch(
              `/api/cards/updateCardPosition/${sourceList.get('_id')}/${movedCard?.get('_id')}`,
              { position: destination.index }
            );

            updateSyncTimestamp()
            toast.success(res.data.message);

          } else {
            // Cross-list movement
            const oldCard = sourceCards.get(source.index);
            if (!oldCard) return;

            const cardData = {
              _id: oldCard.get('_id'),
              name: oldCard.get('name'),
              description: oldCard.get('description') || '',
              slug: oldCard.get('slug'),
              dueDate: oldCard.get('dueDate'),
              members: oldCard.get('members') as LiveList<LiveObject<UserLson>>,
              comments: oldCard.get('comments'),
              checklists: oldCard.get('checklists'),
              attachments: oldCard.get('attachments'),
            }

            sourceCards.delete(source.index);

            const movedCard = new LiveObject<CardLson>({
              ...cardData,
              position: destination.index,
              list: destination.droppableId,
              members: new LiveList(cardData.members?.toArray() || []),
            });

            destCards.insert(movedCard, destination.index);

            sourceCards.toArray().forEach((card, index) => {
              card.set('position', index);
            });
            destCards.toArray().forEach((card, index) => {
              card.set('position', index);
            });

            const res = await axios.patch(
              `/api/cards/updateCardPosition/${destList.get('_id')}/${cardData._id}`,
              { position: destination.index }
            );

            updateSyncTimestamp()
            toast.success(res.data.message);
          }
        }

      } catch (err) {
        // Rollback on error by refreshing with fresh data
        console.error('Drag operation failed, rolling back:', err);

        const axiosErr = err as AxiosError<ApiResponse>;
        toast.error(`Failed to update ${type} position. Rolling back...`, {
          description: axiosErr.response?.data.message || 'Unknown error',
        });

        // Refresh storage with fresh data from server
        setTimeout(() => {
          refreshStorageWithFreshData()
        }, 1000);
      }
    },
    [boardData, updateSyncTimestamp]
  );

  if (isBoardLoading && !fallbackLists) {
    return <div>Loading...</div>;
  }

  // Only show "No lists available" if we truly have no data (not during sync)
  if (!displayLists || displayLists.length === 0) {
    return (
      <div className={`${bgColor} h-full`}>
        <BoardNavbar
          _id={boardData?._id as string}
          members={members as User[]}
          boardName={boardData?.name as string}
        />
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>No lists available</div>
            {isStorageSyncing && (
              <Button
                variant="outline"
                size="sm"
                disabled
              >
                Syncing...
              </Button>
            )}
          </div>
          <CreateListButton
            boardId={boardData?._id as string}
            currentUser={members.find(member =>
              member._id === self?.id
            )}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`${bgColor} h-full`}>
      <BoardNavbar
        _id={boardData?._id as string}
        members={members as User[]}
        boardName={boardData?.name as string}
      />

      {/* Sync indicator */}
      {/* {isStorageSyncing && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-2 text-sm">
          Synchronizing with latest changes...
        </div>
      )} */}

      <ScrollArea className="h-max whitespace-nowrap overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId='lists' type='list' direction='horizontal'>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className='flex w-max space-x-4 p-4'
              >
                {displayLists && displayLists.map((list) => (
                  <ListComponent
                    boardMembers={members}
                    listInfo={list}
                    key={list._id}
                  />
                ))}

                {provided.placeholder}

                <CreateListButton
                  boardId={boardData?._id as string}
                  currentUser={members.find(member =>
                    member._id === self?.id
                  )}
                />
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <ScrollBar orientation='horizontal' className="hidden" />
      </ScrollArea>
    </div>
  );
};

export default BoardContent