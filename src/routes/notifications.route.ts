import express from "express";
import { Db } from "mongodb";
import { 
  getUserNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification, 
  deleteAllNotifications,
  createTestNotification 
} from '../controllers/notifications.controller.js';

export const notificationsRouter = (db: Db) => {
  const router = express.Router();

  router.get("/:userId", getUserNotifications(db));
  router.get("/:userId/unread", getUnreadCount(db));
  
  router.delete( "/user/:userId", deleteAllNotifications(db) );

  router.patch("/:id/read", markAsRead(db));
  router.patch("/user/:userId/read-all", markAllAsRead(db));
  router.delete("/:id", deleteNotification(db));
  router.post("/test", createTestNotification(db));

  return router;
};
