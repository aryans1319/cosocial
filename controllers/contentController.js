const { Content, User } = require('../models/index');
const asyncHandler = require('express-async-handler');

const getAllContent = asyncHandler (async(req, res) => {
    let contents;
    const email = req.query.email;
    try {
        contents = await Content.find({ email });
        return res.status(200).json({
            contents
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
          message: "Something went wrong",
        });
    }
})

const createContent = asyncHandler(async (req, res) => {
    try {
      const { title, description, save, email } = req.body;
  
      const newContent = new Content({
        title,
        description,
        email,
      });
  
      if (save) {
        await newContent.save();
        res.status(200).json({
          message: "Content saved successfully!",
          content: newContent,
        });
      } else {
        res.status(201).json({
          message: "Draft created successfully!",
          content: newContent,
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Something went wrong! Couldn't create",
      });
    }
  });

const updateContent = asyncHandler(async(req, res) => {
    try {
        const { title, description } = req.body;
        const contentID = req.params.id;
        let updatedContent;
        updatedContent = await Content.findByIdAndUpdate(contentID, {
            title, 
            description
        });
        res.status(200).json({
            message: "Content Updated successfully",
            content: updatedContent
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message : "Unable to update the blog"
        })
    }
})
module.exports = {
    getAllContent,
    createContent,
    updateContent
}
