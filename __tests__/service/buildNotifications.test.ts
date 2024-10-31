import { describe, it, expect } from "@jest/globals";
import {
  IntervalScheduleType,
  IntervalType,
  RepeatFrequencyType,
  RepeatUntilType,
} from "../../types/communication";
import { buildNotifications } from "../../service/buildNotifications";
import moment from "moment";

describe("buildNotifications function tests", () => {
  const visitTime = new Date("2024-01-01T12:00:00Z");

  it("should handle undefined scheduleTimes gracefully", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.daily,
      schedule_time: undefined,
    };
    const notifications = await buildNotifications(
      { type: IntervalType.same_day},
      visitTime,
      repeatFrequency,
      {}
    );
    expect(notifications).toEqual([]);
  });

  it("should handle empty scheduleTimes  gracefully", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.daily,
      schedule_time: [],
    };
    const notifications = await buildNotifications(
      { type: IntervalType.same_day},
      visitTime,
      repeatFrequency,
      {}
    );
    expect(notifications).toEqual([]);
  });

  it("should handle undefined times within scheduleTimes", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.daily,
      schedule_time: [{ times: undefined }],
    };
    const notifications = await buildNotifications(
      { type: IntervalType.same_day},
      visitTime,
      repeatFrequency,
      {}
    );
    expect(notifications).toEqual([]);
  });

  it("should handle empty times array within scheduleTimes", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.daily,
      schedule_time: [{ times: [] }],
    };
    const notifications = await buildNotifications(
      { type: IntervalType.same_day},
      visitTime,
      repeatFrequency,
      {}
    );
    expect(notifications).toEqual([]);
  });

  it("should build daily notifications correctly", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.daily,
      schedule_time: [{ times: ["01:00 PM", "05:00 PM"] }],
    };
    const stopCriteria = {
      type: RepeatUntilType.no_of_times,
      duration: "3",
    };

    const expectedNotifications = [
      "2024-01-01T13:00:00.000Z",
      "2024-01-01T17:00:00.000Z",
      "2024-01-02T13:00:00.000Z",
      "2024-01-02T17:00:00.000Z",
      "2024-01-03T13:00:00.000Z",
      "2024-01-03T17:00:00.000Z",
    ];

    const notifications = await buildNotifications(
      { type: IntervalType.same_day},
      visitTime,
      repeatFrequency,
      stopCriteria
    );
    expect(notifications).toEqual(expectedNotifications);
  });
  
  it("#2813 Program Study Visit Reminders: should build daily notifications correctly based on before Interval", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.daily,
      schedule_time: [{ times: ["07:00 PM"] }],
    };
    const stopCriteria = {
      type: RepeatUntilType.always
    };

    const expectedNotifications = [
      "2024-04-18T19:00:00.000Z",
      "2024-04-19T19:00:00.000Z",
    ];

    const notifications = await buildNotifications(
      { type: IntervalType.before, no_of_days: '2' },
      new Date("2024-04-20T15:00:00Z"),
      repeatFrequency,
      stopCriteria
    );

    expect(notifications).toEqual(expectedNotifications);
  });

  it("#2814 Program e-Diary Reminders: Scenario 1 Sending eDiary Reminders for next 7 days", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.daily,
      schedule_time: [{ times: ["03:00 PM", "08:00 PM"] }],
    };
    const stopCriteria = {
      type: RepeatUntilType.days,
      duration: "7",
    };

    const expectedNotifications = [
      "2024-04-20T15:00:00.000Z",
      "2024-04-20T20:00:00.000Z",
      "2024-04-21T15:00:00.000Z",
      "2024-04-21T20:00:00.000Z",
      "2024-04-22T15:00:00.000Z",
      "2024-04-22T20:00:00.000Z",
      "2024-04-23T15:00:00.000Z",
      "2024-04-23T20:00:00.000Z",
      "2024-04-24T15:00:00.000Z",
      "2024-04-24T20:00:00.000Z",
      "2024-04-25T15:00:00.000Z",
      "2024-04-25T20:00:00.000Z",
      "2024-04-26T15:00:00.000Z",
      "2024-04-26T20:00:00.000Z",
    ];

    const notifications = await buildNotifications(
      { type: IntervalType.same_day },
      new Date("2024-04-20T14:30:00Z"),
      repeatFrequency,
      stopCriteria
    );

    expect(notifications).toEqual(expectedNotifications);
  });

  it("#2814 Program e-Diary Reminders: Scenario 2 Sending eDiary Reminders for next 7 days", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.daily,
      schedule_time: [{ times: ["03:00 PM", "08:00 PM"] }],
    };
    const stopCriteria = {
      type: RepeatUntilType.days,
      duration: "7",
    };

    const expectedNotifications = [
      "2024-04-20T20:00:00.000Z",
      "2024-04-21T15:00:00.000Z",
      "2024-04-21T20:00:00.000Z",
      "2024-04-22T15:00:00.000Z",
      "2024-04-22T20:00:00.000Z",
      "2024-04-23T15:00:00.000Z",
      "2024-04-23T20:00:00.000Z",
      "2024-04-24T15:00:00.000Z",
      "2024-04-24T20:00:00.000Z",
      "2024-04-25T15:00:00.000Z",
      "2024-04-25T20:00:00.000Z",
      "2024-04-26T15:00:00.000Z",
      "2024-04-26T20:00:00.000Z",
    ];

    const notifications = await buildNotifications(
      { type: IntervalType.same_day },
      new Date("2024-04-20T17:30:00Z"),
      repeatFrequency,
      stopCriteria
    );

    expect(notifications).toEqual(expectedNotifications);
  });

  it("#2886 Program Pre-enrollment Appointment Reminders: Pre-scheduled/Screen Scheduled to receive Reminder about Appointment for 3 days.", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.daily,
      schedule_time: [{ times: ["06:00 PM"] }],
    };
    const stopCriteria = {type: RepeatUntilType.always};

    const expectedNotifications = [
      "2024-04-17T18:00:00.000Z",
      "2024-04-18T18:00:00.000Z",
      "2024-04-19T18:00:00.000Z",
    ];

    const notifications = await buildNotifications(
      { type: IntervalType.before, no_of_days: "3" },
      new Date("2024-04-20T14:00:00Z"),
      repeatFrequency,
      stopCriteria
    );

    expect(notifications).toEqual(expectedNotifications);
  });
  
  it("#2895 Send Survey Texts/Emails: First Study Visit Survey: using Repeat Frequency one time", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.one_time,
      schedule_time: [{ times: ["05:00 PM", "07:00 PM"] }],
    };
    const stopCriteria = {type: undefined};

    const expectedNotifications = [
      "2024-04-20T17:00:00.000Z",
      "2024-04-20T19:00:00.000Z",
    ];

    const notifications = await buildNotifications(
      { type: undefined },
      new Date("2024-04-20T14:00:00Z"),
      repeatFrequency,
      stopCriteria
    );

    expect(notifications).toEqual(expectedNotifications);
  });
  
  it("#2895 Send Survey Texts/Emails: First Study Visit Survey: using Interval", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.one_time,
    };
    const stopCriteria = {type: undefined};

    const expectedNotifications = [
      "2024-04-20T17:00:00.000Z",
    ];

    const notifications = await buildNotifications(
      { type: IntervalType.after, no_of_days: "3", interval_schedule_type: IntervalScheduleType.hours },
      new Date("2024-04-20T09:00:00-05:00"),
      repeatFrequency,
      stopCriteria
    );

    expect(notifications).toEqual(expectedNotifications);
  });

  it("#2895 Study Completed Survey: Study Completed Survey", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.one_time,
    };
    const stopCriteria = {type: undefined};

    const expectedNotifications = [
      "2024-04-20T15:00:00.000Z",
    ];

    const notifications = await buildNotifications(
      { type: IntervalType.after, no_of_days: "1", interval_schedule_type: IntervalScheduleType.hours },
      new Date("2024-04-20T14:00:00Z"),
      repeatFrequency,
      stopCriteria
    );

    expect(notifications).toEqual(expectedNotifications);
  });

  it("should build daily notifications correctly based on before Interval in Hours", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.daily,
      // schedule_time: [{ times: ["01:00 PM", "05:00 PM"] }],
    };
    const stopCriteria = {
      type: RepeatUntilType.no_of_times,
      duration: "3",
    };

    const expectedNotifications = [
        "2024-01-01T10:00:00.000Z",
    ];

    const notifications = await buildNotifications(
      { type: IntervalType.before, no_of_days: '2', interval_schedule_type: IntervalScheduleType.hours },
      visitTime,
      repeatFrequency,
      stopCriteria
    );
    expect(notifications).toEqual(expectedNotifications);
  });
  
  it("should build daily notifications correctly based on after Interval in Hours", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.daily,
      // schedule_time: [{ times: ["01:00 PM", "05:00 PM"] }],
    };
    const stopCriteria = {
      type: RepeatUntilType.no_of_times,
      duration: "3",
    };

    const expectedNotifications = [
        "2024-01-01T14:00:00.000Z",
        "2024-01-02T14:00:00.000Z",
        "2024-01-03T14:00:00.000Z",
    ];

    const notifications = await buildNotifications(
      { type: IntervalType.after, no_of_days: '2', interval_schedule_type: IntervalScheduleType.hours },
      visitTime,
      repeatFrequency,
      stopCriteria
    );
    expect(notifications).toEqual(expectedNotifications);
  });

  it("should build daily notifications correctly based on after Interval", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.daily,
      schedule_time: [{ times: ["01:00 PM", "05:00 PM"] }],
    };
    const stopCriteria = {
      type: RepeatUntilType.always,
    };

    const expectedNotifications = [
      "2024-06-04T13:00:00.000Z",
      "2024-06-04T17:00:00.000Z",
      "2024-06-05T13:00:00.000Z",
      "2024-06-05T17:00:00.000Z",
      "2024-06-06T13:00:00.000Z",
      "2024-06-06T17:00:00.000Z",
      "2024-06-07T13:00:00.000Z",
    ];

    const notifications = await buildNotifications(
      { type: IntervalType.before, no_of_days: '3' },
      new Date("2024-06-07T15:00:00Z"),
      repeatFrequency,
      stopCriteria,
    );
    expect(notifications).toEqual(expectedNotifications);
  });

  it("should stop after the correct number of times", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.daily,
      schedule_time: [{ times: ["01:00 PM"] }],
    };
    const stopCriteria = {
      type: RepeatUntilType.no_of_times,
      duration: "1",
    };

    const expectedNotifications = ["2024-01-01T13:00:00.000Z"];

    const notifications = await buildNotifications(
      { type: IntervalType.same_day},
      visitTime,
      repeatFrequency,
      stopCriteria
    );
    expect(notifications).toEqual(expectedNotifications);
    expect(notifications.length).toBe(1);
  });

  it("should stop after the correct date as we define the stop date", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.daily,
      schedule_time: [{ times: ["01:00 PM"] }],
    };
    const stopCriteria = {
      type: RepeatUntilType.date,
      end_date: new Date("2024-01-04T00:00:00.000Z"),
    };

    const notifications = await buildNotifications(
      { type: IntervalType.same_day},
      visitTime,
      repeatFrequency,
      stopCriteria
    );
    expect(notifications.length).toBe(3);
  });

  it("should stop after the first as no RepeatUntil is matching", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.daily,
      schedule_time: [{ times: ["01:00 PM"] }],
    };
    const stopCriteria = {
      type: undefined,
      //   end_date: '2024-01-04T00:00:00.000Z'
    };

    const notifications = await buildNotifications(
      { type: IntervalType.same_day},
      visitTime,
      repeatFrequency,
      stopCriteria
    );
    expect(notifications.length).toBe(1);
  });
});

describe("Weekly Notifications", () => {
  const visitTime = new Date("2024-05-01T12:00:00Z"); // 1st May 2024
  it("should schedule notifications correctly for multiple days and times", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.weekly,
      schedule_time: [
        {
          day: "Monday",
          times: ["01:00 PM", "03:00 PM"],
        },
        {
          day: "Wednesday",
          times: ["04:00 PM"],
        },
        {
          day: "Friday",
          times: ["01:00 PM", "07:00 PM"],
        },
      ],
    };
    const stopCriteria = {
      type: RepeatUntilType.no_of_times,
      duration: "4", // Will schedule for 4 weeks
    };

    const notifications = await buildNotifications(
      { type: IntervalType.same_day},
      visitTime,
      repeatFrequency,
      stopCriteria
    );

    expect(notifications.length).toEqual(18); // 3 days = 5 Times * 4 weeks = 20 Times - Starting Monday

    // Monday should not contain as we're starting from Wednesday
    expect(notifications).not.toContain(
      moment(visitTime).utc().day(1).hour(13).minute(0).toISOString()
    ); // First Monday at 1 PM

    expect(notifications).toContain(
      moment(visitTime).utc().day(3).hour(16).minute(0).toISOString()
    ); // First Wednesday at 4 PM
  });

  it("should handle empty schedule_time gracefully", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.weekly,
      schedule_time: undefined,
    };
    const stopCriteria = {
      type: RepeatUntilType.no_of_times,
      duration: "4", // Will schedule for 4 weeks
    };

    const notifications = await buildNotifications(
      { type: IntervalType.same_day},
      visitTime,
      repeatFrequency,
      stopCriteria
    );

    expect(notifications.length).toEqual(0);
  });

  it("should handle empty schedule_time:time gracefully", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.weekly,
      schedule_time: [
        {
          day: undefined,
          times: undefined,
        },
      ],
    };
    const stopCriteria = {
      type: RepeatUntilType.no_of_times,
      duration: "4", // Will schedule for 4 weeks
    };

    const notifications = await buildNotifications(
      { type: IntervalType.same_day},
      visitTime,
      repeatFrequency,
      stopCriteria
    );

    expect(notifications.length).toEqual(0);
  });
});

describe("Monthly Notifications", () => {
  const visitTime = new Date("2024-05-01T12:00:00Z"); // 1st May 2024
  it("should schedule notifications correctly for multiple dates and times", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.monthly,
      schedule_time: [
        {
          date: new Date("2024-05-01T12:00:00Z"),
          times: ["10:00 AM", "07:00 PM"],
        },
        {
          date: new Date("2024-05-15T12:00:00Z"),
          times: ["08:00 AM", "04:00 PM"],
        },
      ],
    };
    const stopCriteria = {
      type: RepeatUntilType.no_of_times,
      duration: "3", // Will schedule for 3 months
    };

    const notifications = await buildNotifications(
      { type: IntervalType.same_day},
      visitTime,
      repeatFrequency,
      stopCriteria
    );
    expect(notifications.length).toEqual(11); // 2 dates * 2 times * 3 months

    // As Start time is 1st May 12 Noon, 10 AM should not be included
    expect(notifications).not.toContain(
      moment(visitTime).utc().date(1).hour(10).minute(0).toISOString()
    ); // 1st of each month at 10 AM

    // 1st - 7 PM should be included
    expect(notifications).toContain(
      moment(visitTime).utc().date(1).hour(19).minute(0).toISOString()
    ); // 1st of each month at 10 AM

    // 15th 4 PM should be included
    expect(notifications).toContain(
      moment(visitTime).utc().date(15).hour(16).minute(0).toISOString()
    ); // 15th of each month at 4 PM
  });

  it("should handle empty schedule_time gracefully", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.monthly,
      schedule_time: undefined,
    };
    const stopCriteria = {
      type: RepeatUntilType.no_of_times,
      duration: "3", // Will schedule for 3 months
    };

    const notifications = await buildNotifications(
      { type: IntervalType.same_day},
      visitTime,
      repeatFrequency,
      stopCriteria
    );
    expect(notifications.length).toEqual(0);
  });

  it("should handle empty schedule_time:times gracefully", async () => {
    const repeatFrequency = {
      type: RepeatFrequencyType.monthly,
      schedule_time: [
        {
          date: new Date("2024-05-01T12:00:00Z"),
          times: undefined,
        },
      ],
    };
    const stopCriteria = {
      type: RepeatUntilType.no_of_times,
      duration: "3", // Will schedule for 3 months
    };

    const notifications = await buildNotifications(
      { type: IntervalType.same_day},
      visitTime,
      repeatFrequency,
      stopCriteria
    );
    expect(notifications.length).toEqual(0);
  });
});
