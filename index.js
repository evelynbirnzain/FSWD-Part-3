require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()

morgan.token('body', (req, res) => JSON.stringify(req.body));
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'));

app.use(cors())
app.use(express.static('build'))
app.use(express.json())

app.get('/api/persons', (request, response) => {
    Person.find({}).then(ps => {
        response.json(ps)
    })
})

app.get('/api/info', (request, response, next) => {
    Person.count()
        .then(number => {
                const template = `<div>Phonebook has info for ${number} people</div><div>${new Date()}</div>`
                response.send(template)
            }
        ).catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id)
        .then(p => {
            if (p) {
                response.json(p)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => next(error))
})


app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndRemove(request.params.id)
        .then(result => {
            response.status(204).end()
        })
        .catch(error => next(error))
})

app.post('/api/persons', (request, response) => {
    const body = request.body

    if (!body.name) {
        return response.status(400).json({
            error: 'name missing'
        })
    }

    if (!body.number) {
        return response.status(400).json({
            error: 'number missing'
        })
    }

    const entry = new Person({
        name: body.name, number: body.number
    })

    entry.save().then(saved => {
        response.json(saved)
    })
})

app.put('/api/persons/:id', (request, response, next) => {
    const body = request.body

    if (!body.name) {
        return response.status(400).json({
            error: 'name missing'
        })
    }

    if (!body.number) {
        return response.status(400).json({
            error: 'number missing'
        })
    }

    const entry = {
        name: body.name, number: body.number
    }

    Person.findByIdAndUpdate(request.params.id, entry, {new: true})
        .then(updated => {
            response.json(updated)
        })
        .catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
    response.status(404).send({error: 'unknown endpoint'})
}

// handler of requests with unknown endpoint
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({error: 'malformatted id'})
    }

    next(error)
}

// handler of requests with result to errors
app.use(errorHandler)


const PORT = process.env.PORT || "8080"
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})