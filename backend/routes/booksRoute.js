import express from "express";
import { Book } from "../models/bookModel.js";
const router = express.Router();

// Route to save new book
router.post('/', async (req,res) => {
    try {
        if (
            !req.body.title || !req.body.author || !req.body.publishYear
        )
        {
            return res.status(400).send({
                message: 'send all required fields: title, authro, publishYear',
            });
        }

        const newBook = {
            title: req.body.title,
            author: req.body.author,
            publishYear: req.body.publishYear,
        };

        const book = await Book.create(newBook);
        return res.status(201).send(book);
    }catch(error) {
        console.log(error.message);
        res.status(500).send({message: error.message});
    }
});

// ROUTE to get all the books in database
router.get('/', async (req,res) => {
    try{
        const books = await Book.find({});
        return res.status(200).json({
            count: books.length,
            data: books
        });
    }catch(error) {
        console.log(error.message);
        return res.status(500).send({message: error.message});
    }
});

// ROUTE to get book by id
router.get('/:id', async (req,res) => {
    try {
        const {id} = req.params;
        const book = await Book.findById(id);
        return res.status(200).json(book);
    }catch(error) {
        console.log(error.message);
        return res.status(500).send({message: error.message});
    }
});

// ROUTE to delete a book
router.delete('/:id', async (req,res) => {
    try {

        const {id} = req.params;
        const result = await Book.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).send({message: "Cannot be deleted"});
        } 
        
        return res.status(200).send({message: "Successfully deleted book"});
        

    } catch(error) {
        console.log(error.message);
        res.status(500).send({message: error.message});
    }
});

// ROUTE to update a book
router.put('/:id', async (req,res) => {
    try {

        if (!req.body.title || !req.body.author || !req.body.publishYear) {
            return res.status(404).send({message: "No fields passed into update"});
        }

        const {id} = req.params;
        const result = await Book.findByIdAndUpdate(id, req.body);

        if(!result) {
            return res.status(404).json({message: "Cannot find book"});
        }

        return res.status(200).send({message: "Book updated successfully"});

    } catch(error) {
        console.log(error.message);
        return res.status(500).send({message:error.message});
    }
});

export default router;
