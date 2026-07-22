const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, roomController.listPublicRooms);
router.post('/create', verifyToken, roomController.createRoom);
router.post('/join', verifyToken, roomController.joinRoom);
router.get('/:id', verifyToken, roomController.getRoomById);
router.delete('/:id', verifyToken, roomController.deleteRoom);

module.exports = router;
