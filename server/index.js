import express from 'express';

const app = express();
app.use(express.json());

let events = [
  {
    id: 1,
    title: 'Welcome party for Erasmus students',
    description: 'Meet the other exchange students, eat pizza and get your welcome pack.',
    date: '2026-10-15T18:00',
    location: 'Main hall, building A',
    capacity: 120,
  },
  {
    id: 2,
    title: 'Hackathon: apps for the city',
    description: 'Build an app that makes life in Kraków easier. Teams of 3 to 5, prizes for the top three.',
    date: '2026-11-07T09:00',
    location: 'Lab 204',
    capacity: 40,
  },
  {
    id: 3,
    title: 'Board game night',
    description: 'Bring your favourite game or learn a new one. Beginners welcome.',
    date: '2026-10-22T19:00',
    location: 'Student club',
    capacity: 30,
  },
];
let nextId = 4;

function validateEvent(body) {
  if (typeof body.title !== 'string' || body.title.trim().length < 3 || body.title.trim().length > 120) {
    return 'title must have at least 3 characters and at most 120 characters.';
  }
  if (typeof body.date !== 'string' || !isValidDate(body.date) || new Date(body.date) < new Date()) {
    return 'date must be a valid date in the future, e.g. 2050-10-15T18:00';
  }
  if (!Number.isInteger(body.capacity) || body.capacity < 1) {
    return 'capacity must be a whole number greater than 0';
  }
  if(body.description && (typeof body.description !== 'string' || body.description.trim().length > 1000)) {
    return 'description must be a string with at most 1000 characters.';
  }
  if(body.location && (typeof body.location !== 'string' || body.location.trim().length > 100)) {
    return 'location must be a string with at most 100 characters.';
  }
  return null;
}

function toEvent(id, body) {
  return {
    id,
    title: body.title.trim(),
    description: body.description ?? '',
    date: body.date,
    location: body.location ?? '',
    capacity: body.capacity,
  };
}

function isValidDate(dateString) {
  const timestamp = Date.parse(dateString);
  return !Number.isNaN(timestamp);
}

app.get('/api/events', (req, res) => {
  const q = String(req.query.q ?? '').toLowerCase();
  let result = events
    .filter((e) => e.title.toLowerCase().includes(q))
    .sort((a, b) => a.date.localeCompare(b.date));
  // ?from=2026-11-01 returns only events on or after that date;
  const from = isValidDate(req.query.from) ? new Date(req.query.from) : null;
  if (from) {
    result = result.filter((e) => new Date(e.date) >= from);
  }
  // ?sort=title sorts by title instead of by date.
  if (req.query.sort === 'title') {
    result.sort((a, b) => a.title.localeCompare(b.title));
  }
  res.json(result);
});

app.get('/api/events/:id', (req, res) => {
  const event = events.find((e) => e.id === Number(req.params.id));
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json(event);
});

app.get('/api/stats', (req, res) => {
  const totalCount = events.length;
  const totalCapacity = events.reduce((sum, e) => sum + e.capacity, 0);
  const nextEvent = events.reduce((next, e) => {
    if(new Date(e.date) > new Date()) return next; // ignore past events
    if (!next || new Date(e.date) < new Date(next.date)) {
      return e;
    }
  }, null);
  const summary = {
    count: totalCount,
    totalCapacity: totalCapacity,
    nextEvent: nextEvent,
  };
  return res.json(summary);      
});

app.post('/api/events', (req, res) => {
  const error = validateEvent(req.body);
  if (error) {
    return res.status(400).json({ error });
  }
  const event = toEvent(nextId++, req.body);
  events.push(event);
  res.status(201).json(event);
});

app.put('/api/events/:id', (req, res) => {
  const index = events.findIndex((e) => e.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }
  const error = validateEvent(req.body);
  if (error) {
    return res.status(400).json({ error });
  }
  events[index] = toEvent(events[index].id, req.body);
  res.json(events[index]);
});

app.delete('/api/events/:id', (req, res) => {
  const before = events.length;
  events = events.filter((e) => e.id !== Number(req.params.id));
  if (events.length === before) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.status(204).end();
});

app.listen(3000, () => {
  console.log('API running on http://localhost:3000');
});