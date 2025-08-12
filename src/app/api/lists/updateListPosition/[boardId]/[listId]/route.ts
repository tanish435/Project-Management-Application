// import { authOptions } from "@/app/api/auth/[...nextauth]/options";
// import dbConnect from "@/lib/dbConnect";
// import BoardModel from "@/models/Board.model";
// import ListModel from "@/models/List.model";
// import { ApiResponse } from "@/utils/ApiResponse";
// import mongoose from "mongoose";
// import { getServerSession, User } from "next-auth";

// export async function PATCH(req: Request, { params }: { params: { listId: string, boardId: string } }) {
//     await dbConnect();
//     const session = await getServerSession(authOptions);
//     const user: User = session?.user as User;

//     if (!session || !session.user) {
//         return new Response(JSON.stringify(new ApiResponse(401, null, "Not authenticated")), {
//             status: 401,
//             headers: { "Content-Type": "application/json" },
//         });
//     }

//     const { listId, boardId } = params;
//     const { searchParams } = new URL(req.url);
//     const newPos = Number(searchParams.get("pos"));

//     if (isNaN(newPos) || newPos < 0) {
//         return new Response(JSON.stringify(new ApiResponse(400, null, "Invalid position index")), {
//             status: 400,
//             headers: { "Content-Type": "application/json" },
//         });
//     }

//     if (!mongoose.Types.ObjectId.isValid(listId) || !mongoose.Types.ObjectId.isValid(boardId)) {
//         return new Response(JSON.stringify(new ApiResponse(400, null, "Invalid ID(s)")), {
//             status: 400,
//             headers: { "Content-Type": "application/json" },
//         });
//     }

//     try {
//         const board = await BoardModel.findById(boardId);
//         if (!board) {
//             return new Response(JSON.stringify(new ApiResponse(404, null, "Board not found")), {
//                 status: 404,
//                 headers: { "Content-Type": "application/json" },
//             });
//         }

//         if (!board.members.some((memberId: mongoose.Types.ObjectId) => memberId.equals(user._id))) {
//             return new Response(JSON.stringify(new ApiResponse(403, null, "Not authorized")), {
//                 status: 403,
//                 headers: { "Content-Type": "application/json" },
//             });
//         }

//         const lists = await ListModel.find({ board: boardId }).sort({ position: 1 }).lean();
//         const listToMove = lists.find((l) => l._id.toString() === listId);

//         if (!listToMove) {
//             return new Response(JSON.stringify(new ApiResponse(404, null, "List not found")), {
//                 status: 404,
//                 headers: { "Content-Type": "application/json" },
//             });
//         }

//         const oldPos = listToMove.position;

//         if (newPos >= lists.length) {
//             return new Response(JSON.stringify(new ApiResponse(400, null, "Position out of bounds")), {
//                 status: 400,
//                 headers: { "Content-Type": "application/json" },
//             });
//         }

//         const reorderedLists = lists.filter(l => l._id.toString() !== listId);
//         reorderedLists.splice(newPos, 0, listToMove);

//         const sessionDb = await mongoose.startSession();
//         sessionDb.startTransaction();

//         await Promise.all(
//             reorderedLists.map((list, index) =>
//                 ListModel.updateOne(
//                     { _id: list._id },
//                     { $set: { position: index } },
//                     { session: sessionDb }
//                 )
//             )
//         );

//         await sessionDb.commitTransaction();
//         sessionDb.endSession();

//         return new Response(JSON.stringify(new ApiResponse(200, null, "List reordered successfully")), {
//             status: 200,
//             headers: { "Content-Type": "application/json" },
//         });

//     } catch (error) {
//         console.error("Error updating list position:", error);
//         return new Response(JSON.stringify(new ApiResponse(500, null, "Internal server error")), {
//             status: 500,
//             headers: { "Content-Type": "application/json" },
//         });
//     }
// }












import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import BoardModel from "@/models/Board.model";
import ListModel from "@/models/List.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

export async function PATCH(req: Request, context: { params: Promise<{ listId: string, boardId: string }> }) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user: User = session?.user as User;

    if (!session || !session.user) {
        return new Response(JSON.stringify(new ApiResponse(401, null, "Not authenticated")), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { listId, boardId } = await context.params;
    const { searchParams } = new URL(req.url);
    const newPos = Number(searchParams.get("pos"));

    if (!mongoose.Types.ObjectId.isValid(listId) || !mongoose.Types.ObjectId.isValid(boardId)) {
        return new Response(JSON.stringify(new ApiResponse(400, null, "Invalid ID(s)")), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }
    
    if (isNaN(newPos) || newPos < 0) {
        return new Response(JSON.stringify(new ApiResponse(400, null, "Invalid position index")), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Start session early to ensure atomicity
    const sessionDb = await mongoose.startSession();
    
    try {
        await sessionDb.withTransaction(async () => {
            // Fetch board with session to ensure consistency
            const board = await BoardModel.findById(boardId).session(sessionDb);
            if (!board) {
                throw new Error("Board not found");
            }

            if (!board.members.some((memberId: mongoose.Types.ObjectId) => memberId.equals(user._id))) {
                throw new Error("Not authorized");
            }

            // Fetch lists with session and sort by position
            const lists = await ListModel.find({ board: boardId })
                .sort({ position: 1 })
                .session(sessionDb)
                .lean();

            const listToMove = lists.find((l) => l._id.toString() === listId);

            if (!listToMove) {
                throw new Error("List not found");
            }

            if (newPos >= lists.length) {
                throw new Error("Position out of bounds");
            }

            const currentPos = listToMove.position;
            
            // Skip if already in the correct position
            if (currentPos === newPos) {
                return;
            }

            // More efficient position updates based on direction of move
            if (currentPos < newPos) {
                // Moving forward: decrease position of lists between old and new position
                await ListModel.updateMany(
                    {
                        board: boardId,
                        position: { $gt: currentPos, $lte: newPos }
                    },
                    { $inc: { position: -1 } },
                    { session: sessionDb }
                );
            } else {
                // Moving backward: increase position of lists between new and old position
                await ListModel.updateMany(
                    {
                        board: boardId,
                        position: { $gte: newPos, $lt: currentPos }
                    },
                    { $inc: { position: 1 } },
                    { session: sessionDb }
                );
            }

            // Update the moved list's position
            await ListModel.updateOne(
                { _id: listId },
                { $set: { position: newPos, updatedAt: new Date() } },
                { session: sessionDb }
            );
        });

        return new Response(JSON.stringify(new ApiResponse(200, null, "List reordered successfully")), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error updating list position:", error);
        
        // Return appropriate error based on the error message
        if (error instanceof Error) {
            switch (error.message) {
                case "Board not found":
                    return new Response(JSON.stringify(new ApiResponse(404, null, "Board not found")), {
                        status: 404,
                        headers: { "Content-Type": "application/json" },
                    });
                case "Not authorized":
                    return new Response(JSON.stringify(new ApiResponse(403, null, "Not authorized")), {
                        status: 403,
                        headers: { "Content-Type": "application/json" },
                    });
                case "List not found":
                    return new Response(JSON.stringify(new ApiResponse(404, null, "List not found")), {
                        status: 404,
                        headers: { "Content-Type": "application/json" },
                    });
                case "Position out of bounds":
                    return new Response(JSON.stringify(new ApiResponse(400, null, "Position out of bounds")), {
                        status: 400,
                        headers: { "Content-Type": "application/json" },
                    });
            }
        }
        
        return new Response(JSON.stringify(new ApiResponse(500, null, "Internal server error")), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    } finally {
        await sessionDb.endSession();
    }
}