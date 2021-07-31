const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
const props= ['deliverTo', 'mobileNumber', 'dishes'];

// Helpers;=
const hasProp = (obj, props) => {
    let message;

    for (let i = 0; i < props.length; i++) {
        const prop = props[i];

        if (!obj.hasOwnProperty(prop) || !obj[prop]) {
            return message = `Order must include a ${prop}`;
        } 
        if (prop === 'dishes') {
            const dishes = obj[prop];
            if (!Array.isArray(dishes) || dishes.length === 0) {
                return message = `Order must include at least one dish`;
            }

            for (let i = 0; i < dishes.length; i++) {
                const dish = dishes[i];
                if (!dish.hasOwnProperty('quantity') || dish['quantity'] <= 0 || !Number.isInteger(dish['quantity'])) {
                    return message = `Dish ${i} must have a quantity that is an integer greater than 0`; 
                }
            }
        }
    }
    return true;
}

// Middleware
const orderExists = (req, res, next) => {
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id === orderId);

    if (foundOrder === undefined) {
        return next({
            status: 404,
            message: `Order does not exist: ${orderId}`
        })
    }
    res.locals.order = foundOrder;
    next();
}
function isStatusValid(req, res, next) {
    const { data: { status } = {} } = req.body;

    try {
        if (
        status !== ("pending" || "preparing" || "out-for-delivery" || "delivered")
        ) {
        next({
            status: 400,
            message:
            " Order must have a status of pending, preparing, out-for-delivery, delivered.",
        });
        }
        if (status === "delivered") {
        return next({
            status: 400,
            message: " A delivered order cannot be changed.",
        });
        }
        next();
    } catch (error) {
        console.log("ERROR =", error);
    }
}



//CRUDL
const create = (req, res, next) => {
    const {data: input = {}} = req.body;

    const newOrder = {
        id: nextId(),
        ...input
    }

    if (hasProp(input, props) !== true) {
        return next({
            status: 400,
            message: `Order must include a ${hasProp(input, props)}`
        })
    }

    orders.push(newOrder);
    res.status(201).json({data: newOrder});
}

const read = (req, res, next) => {
    res.json({data: res.locals.order});
}

const update = (req, res, next) => {
    const { orderId } = req.params;
    let currentOrder = res.locals.order;
    const { data: updatedOrder } = req.body;
    
    if (orderId != updatedOrder.id && updatedOrder.hasOwnProperty('id') 
        && updatedOrder.id) {
        
        return next({
            status: 400,
            message: `Order id does not match route id. 
            Order: ${updatedOrder.id}, Route: ${orderId}`
        })
    }

    const result = hasProp(updatedOrder, [...props, 'status']);
    if (result != true) {
        return next({
            status: 400,
            message: result
        }) 
    }

    let entry = 'skip';

    switch (updatedOrder.id) {
        case "":
            entry = currentOrder.id;
            break;
        case null:
            entry = currentOrder.id;
            break;
        case undefined:
            entry = currentOrder.id;
            break;
        default: 'skip';
    }

    if (entry != 'skip') {
        
        updatedOrder.id = entry;
    }

    currentOrder = {
        ...currentOrder,
        ...updatedOrder
    }

    res.json({data: currentOrder})
}

const destroy = (req, res, next) => {
    const foundOrder = res.locals.order;

    if ( foundOrder != undefined) {
        if (res.locals.order.status != 'pending') {
            next({
                status: 400,
                message: 'An order cannot be deleted unless it is pending'
            })
        }
    
        if (foundOrder.status === 'pending') {
            let index = orders.findIndex(order => order.id === res.locals.order.id);
            orders.splice(index, 1);
            res.sendStatus(204);
        }
    }
    
}

const list = (req, res, next) => {
    res.json({data: orders});
}

module.exports = {
    create,
    read: [orderExists, read],
    update: [orderExists, isStatusValid, update],
    delete: [orderExists, destroy],
    list
}
