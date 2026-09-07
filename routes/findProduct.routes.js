const express=require('express');
const router=express.Router();
const {fetchProduct,variantSelection}=require('../controller/productResolve.controller');
const {continueConversation}=require('../controller/conversation.controller');
router.get('/fetchProduct/:productId',fetchProduct);
router.get('/conversationStart/:productId/:attributeValues/:categoryId',variantSelection);
router.get('/conversation/:productId/:attributeValues',variantSelection);
router.post('/continueConversation',continueConversation);

module.exports=router;