import dbConnect from "@/lib/dbConnect";
import BoardModel from "@/models/Board.model";

const generateUniqueUrlId = async (): Promise<string> => {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let url;
    let exists;

    do {
        await dbConnect()
        url = Array.from({ length: 6 })
            .map(() => characters.charAt(Math.floor(Math.random() * charactersLength)))
            .join('');
        exists = await BoardModel.findOne({ url }); // Check for collision
    } while (exists);

    return url;
};

export default generateUniqueUrlId;