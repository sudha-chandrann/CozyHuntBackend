import { Listing } from "../schema/user.model.js";

const CreateListing = async (req, res) => {
  try {
    const userId= req.user._id;
    const { title, category,subcategory, location, images,guestCount,roomCount,bathroomCount,rent,amenities ,description} = req.body;
    if (description.length === 0 || !subcategory|| !title || !category || !guestCount || !roomCount || !bathroomCount || !rent || images.length === 0 || !location || amenities.length === 0) {
      return res.status(400).json({
        message: "Please fill in all required fields",
        success: false,
        status: 400,
      });
    } 
    const newList = new Listing({
        title,
        category,
        subcategory,
        location,
        images,
        guestCount,
        roomCount,
        bathroomCount,
        rent,
        amenities,
        description,
        ownerId: userId, 
    })
    await newList.save();

    return res.status(201).json({
      message: "List is created successfully",
      data:newList,
      success: true,
      status: 201,
    });
  } catch (error) {
    console.error("CreatingList error:", error);
    return res.status(500).json({
      message: error.message || "Error Creating list",
      success: false,
      status: 500,
    });
  }
};

export { CreateListing };