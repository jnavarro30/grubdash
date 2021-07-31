const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
const propArray = ['name', 'description', 'price', 'image_url'];


// middleware
const propValidation = (obj) => {
    let message;

    for (let i = 0; i < propArray.length; i++) {
        const prop = propArray[i];

        if (prop === 'price') {
            if (!Number.isInteger(obj[prop]) || obj[prop] < 0) {
            message = `Dish must have a price that is an integer greater than 0`;
            return message;
            }
        }
        if (!obj.hasOwnProperty(prop) || !obj[prop]) {
            message = `Dish must include ${prop}`;
            return message;
        } 
    }
    return false;
}

const dishExists = (req, res, next) => {
    const { dishId } = req.params;
    const foundDish = dishes.find(dish => dish.id === dishId);

    if (foundDish === undefined) {
        return next({
            status: 404,
            message: `Dish does not exist: ${dishId}`
        })
    }
    res.locals.dish = foundDish;
    next();
}

//CRUDL
const create = (req, res, next) => {
    const {data: input = {}} = req.body;
    
    const result = propValidation(input);
    if (result) {
        return next({
            status: 400,
            message: result
        }) 
    }

    const newDish = {
        id: nextId(),
        ...input
    }

    dishes.push(newDish);
    res.status(201).json({data: newDish});
}


const read = (req, res, next) => {
    res.json({data: res.locals.dish});
}

const update = (req, res, next) => {
    const { dishId } = req.params;
    let currentDish = res.locals.dish;
    const { data: updatedDish } = req.body;

    if (dishId != updatedDish.id && updatedDish.hasOwnProperty('id') 
        && updatedDish.id) {
        
        return next({
            status: 400,
            message: `Dish id does not match route id. 
            Dish: ${updatedDish.id}, Route: ${dishId}`
        })
    }

    if (!updatedDish.hasOwnProperty('id')) {
        delete currentDish.id;
    } else if (updatedDish.id === null) {
        delete currentDish.id;
        updatedDish.id = null;
    }

    const result = propValidation(updatedDish);
    if (result) {
        return next({
            status: 400,
            message: result
        }) 
    }

    let entry = 'skip';

    switch (updatedDish.id) {
        case "":
            entry = currentDish.id;
            break;
        case null:
            entry = undefined;
            break;
        case undefined:
            entry = undefined;
            break;
        default: 'skip';
    }

    if (entry != 'skip') updatedDish.id = entry;

    currentDish = {
        ...currentDish,
        ...updatedDish
    }

    res.json({data: currentDish})
}

const list = (req, res, next) => {
    res.json({data: dishes});
}



module.exports = {
    create,
    read: [dishExists, read],
    update: [dishExists, update],
    list
}