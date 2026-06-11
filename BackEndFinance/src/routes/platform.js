const express = require('express');
const router = express.Router();
const platformsController = require('../controllers/platformController');

const authMiddleware = require('../middlewares/authMiddleware')

router.use(authMiddleware)

router.post('/post', platformsController.platform_create_post)
router.get('/list', platformsController.platform_list_get)
router.delete('/delete/:id', platformsController.platform_delete)
router.put('/:id', platformsController.platform_update_put)

module.exports = router;