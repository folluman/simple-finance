const express = require('express');
const router = express.Router();
const investmentsController = require('../controllers/investmentsController');

const authMiddleware = require('../middlewares/authMiddleware')

router.use(authMiddleware)

router.post('/post', investmentsController.investment_create_post)

router.get('/list', investmentsController.investment_list_get)

router.delete('/platform/:platform_id', investmentsController.investment_delete_by_platform);

router.delete('/delete/:id', investmentsController.investment_delete)

router.put('/:id', investmentsController.investment_update_put)

module.exports = router;