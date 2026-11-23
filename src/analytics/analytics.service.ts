import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserAnalytics } from './schemas/user-analytics.schema';
import { LoginEvent } from './schemas/login-event.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(UserAnalytics.name)
    private userAnalyticsModel: Model<UserAnalytics>,
    @InjectModel(LoginEvent.name)
    private loginEventModel: Model<LoginEvent>,
  ) {}

  // Track new user signup
  async trackSignup(data: {
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    createdAt: Date;
    signUpMethod: string;
    metadata?: any;
  }) {
    try {
      const analytics = new this.userAnalyticsModel({
        clerkUserId: data.userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        signUpDate: data.createdAt,
        signUpMethod: data.signUpMethod,
        metadata: data.metadata,
      });

      await analytics.save();

      console.log(`✅ Analytics saved for user: ${data.email}`);
      return analytics;
    } catch (error) {
      if (error.code === 11000) {
        console.log(`User ${data.email} already exists in analytics`);
      } else {
        console.error('Error saving analytics:', error);
      }
      throw error;
    }
  }

  // Track user login
  async trackLogin(data: {
    userId: string;
    sessionId: string;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      const login = new this.loginEventModel({
        clerkUserId: data.userId,
        sessionId: data.sessionId,
        loginAt: data.timestamp,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });

      await login.save();

      console.log(`✅ Login tracked for user: ${data.userId}`);
      return login;
    } catch (error) {
      console.error('Error tracking login:', error);
      throw error;
    }
  }

  // Get stats for a specific user
  async getUserStats(userId: string) {
    const user = await this.userAnalyticsModel.findOne({
      clerkUserId: userId,
    });

    const totalLogins = await this.loginEventModel.countDocuments({
      clerkUserId: userId,
    });

    const lastLogin = await this.loginEventModel
      .findOne({ clerkUserId: userId })
      .sort({ loginAt: -1 });

    const firstLogin = await this.loginEventModel
      .findOne({ clerkUserId: userId })
      .sort({ loginAt: 1 });

    return {
      user,
      totalLogins,
      lastLogin: lastLogin?.loginAt,
      firstLogin: firstLogin?.loginAt,
    };
  }

  // Get overall signup statistics
  async getSignupStats() {
    // Total users
    const total = await this.userAnalyticsModel.countDocuments();

    // Signups by method
    const byMethod = await this.userAnalyticsModel.aggregate([
      {
        $group: {
          _id: '$signUpMethod',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          method: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Signups today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = await this.userAnalyticsModel.countDocuments({
      signUpDate: { $gte: today },
    });

    // Signups this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekCount = await this.userAnalyticsModel.countDocuments({
      signUpDate: { $gte: weekAgo },
    });

    // Signups this month
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const monthCount = await this.userAnalyticsModel.countDocuments({
      signUpDate: { $gte: monthAgo },
    });

    return {
      total,
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount,
      byMethod,
    };
  }

  // Get signup trend (daily signups for last 30 days)
  async getSignupTrend(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trend = await this.userAnalyticsModel.aggregate([
      {
        $match: {
          signUpDate: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$signUpDate' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    return trend;
  }

  // Get login activity
  async getLoginActivity(userId?: string) {
    const match = userId ? { clerkUserId: userId } : {};

    const activity = await this.loginEventModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$loginAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: -1 },
      },
      {
        $limit: 30,
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    return activity;
  }

  // Get recent signups
  async getRecentSignups(limit: number = 10) {
    return await this.userAnalyticsModel
      .find()
      .sort({ signUpDate: -1 })
      .limit(limit)
      .select('-__v');
  }

  // Get user by email
  async getUserByEmail(email: string) {
    return await this.userAnalyticsModel.findOne({ email });
  }

  // Update user metadata
  async updateUserMetadata(userId: string, metadata: any) {
    return await this.userAnalyticsModel.findOneAndUpdate(
      { clerkUserId: userId },
      { $set: { metadata } },
      { new: true },
    );
  }
}
