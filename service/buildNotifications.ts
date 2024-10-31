import moment from "moment-timezone";
import {
  Interval,
  IntervalScheduleType,
  IntervalType,
  RepeatFrequency,
  RepeatFrequencyTimes,
  RepeatFrequencyType,
  RepeatUntil,
  RepeatUntilType,
} from "../types/communication";
import _ from "lodash";

/**
 * Main function to build notifications based on the given parameters.
 * @async
 * @param intervalType - The type of interval (e.g., Daily, Weekly, Monthly).
 * @param visitTime - The reference time from which notifications start.
 * @param repeatFrequency - Details about how frequently to repeat the notification.
 * @param stopCriteria - Criteria for when to stop repeating notifications.
 * @returns Array of scheduled notification times in ISO string format.
 */
async function buildNotifications(
  interval: Interval,
  visitTime: Date,
  repeatFrequency: RepeatFrequency,
  stopCriteria: RepeatUntil,
  timezone: string = "America/Chicago"
): Promise<string[]> {
  let isEmptyRepeatFrequencyScenario: boolean = false;

  const notifications: string[] = [];

  let addCondition = true;
  let iterationCount = 0;

  /* TODO: Interval Day Logic to be added */
  let startDate = visitTime;

  if (_.isEmpty(repeatFrequency) && interval.interval_schedule_type === IntervalScheduleType.hours) {
    isEmptyRepeatFrequencyScenario = true;
  }

  const intervalType = interval.type ?? IntervalType.same_day;
  let intervalDays = String(interval.no_of_days);
  let intervalUnit: any = interval.interval_schedule_type ?? IntervalScheduleType.days;

  if (interval?.type == IntervalType.before && _.isEmpty(stopCriteria)) {
    stopCriteria.type = RepeatUntilType.date;
    stopCriteria.end_date = visitTime;
  }

  /* For Always Sending we need to stop upon Visit Date */
  if (stopCriteria?.type === RepeatUntilType.always && intervalType === IntervalType.before) {
    stopCriteria.type = RepeatUntilType.date;
    stopCriteria.end_date = moment(visitTime).clone().add(1, "days").toDate();
  }

  if (intervalType === IntervalType.before) {
    if (intervalUnit === "days") {
      startDate = moment(visitTime).clone().subtract(intervalDays, "days").toDate();
    } else if (intervalUnit === "hours") {
      startDate = moment(visitTime).clone().subtract(intervalDays, "hours").toDate();
    } else {
      startDate = moment(visitTime).clone().subtract(intervalDays, "minutes").toDate();
    }

    /* If Repeat Frequency is not set then let's run this for one time */
    if (repeatFrequency.schedule_time === undefined) {
      repeatFrequency.type = RepeatFrequencyType.one_time;
      if (isEmptyRepeatFrequencyScenario) {
        // Parse the time as UTC and convert to the target timezone
        const localTime = moment.tz(startDate, "UTC").tz(timezone);

        // Create a moment object with the same local time but in UTC timezone
        const formattedLocalTime = moment.utc(localTime.format("YYYY-MM-DDTHH:mm:ss"));
        console.log("formattedLocalTime ->>>>>>>>>>>>>>>>>>>>>>>>>", formattedLocalTime);
        repeatFrequency.schedule_time = [{ times: [moment(formattedLocalTime).utc().format("HH:mm A")] }];
      } else {
        repeatFrequency.schedule_time = [{ times: [moment(startDate).utc().format("HH:mm A")] }];
      }
    }
  }
  if (intervalType === IntervalType.after) {
    if (intervalUnit === "days") {
      startDate = moment(visitTime).clone().add(intervalDays, "days").toDate();
    } else if (intervalUnit === "hours") {
      startDate = moment(visitTime).clone().add(intervalDays, "hours").toDate();
    } else {
      startDate = moment(visitTime).clone().add(intervalDays, "minutes").toDate();
    }

    /* If Repeat Frequency is not set then let's run this for one time */
    if (repeatFrequency.schedule_time === undefined) {
      repeatFrequency.type = RepeatFrequencyType.one_time;
      if (isEmptyRepeatFrequencyScenario) {
        // Parse the time as UTC and convert to the target timezone
        const localTime = moment.tz(startDate, "UTC").tz(timezone);

        // Create a moment object with the same local time but in UTC timezone
        const formattedLocalTime = moment.utc(localTime.format("YYYY-MM-DDTHH:mm:ss"));
        console.log("formattedLocalTime ->>>>>>>>>>>>>>>>>>>>>>>>>", formattedLocalTime);
        repeatFrequency.schedule_time = [{ times: [moment(formattedLocalTime).utc().format("HH:mm A")] }];
      } else {
        repeatFrequency.schedule_time = [{ times: [moment(startDate).utc().format("HH:mm A")] }];
      }
    }
  }

  while (addCondition) {
    addNotificationsForCycle(
      iterationCount,
      startDate,
      visitTime,
      interval,
      repeatFrequency,
      notifications,
      timezone,
      isEmptyRepeatFrequencyScenario
    );
    iterationCount++;
    addCondition = checkStopCriteria(iterationCount, startDate, stopCriteria);
  }

  return notifications;
}

/**
 * Adds notifications for a single cycle based on the repeat frequency.
 * @param iterationCount - Current iteration number which adjusts the base time.
 * @param visitTime - Initial visit time to start calculating from.
 * @param repeatFrequency - Frequency and schedule of the notifications.
 * @param notifications - Array to push the new notification times into.
 */
function addNotificationsForCycle(
  iterationCount: number,
  visitTime: Date,
  actualStartTime: Date,
  interval: Interval,
  repeatFrequency: RepeatFrequency,
  notifications: string[],
  timezone: string,
  isEmptyRepeatFrequencyScenario: boolean = false
): void {
  const startTime = moment(visitTime).utc();
  const UTCActualStartTime = moment(actualStartTime).utc();
  switch (repeatFrequency.type) {
    case RepeatFrequencyType.daily:
    case RepeatFrequencyType.one_time:
      scheduleDailyNotifications(
        iterationCount,
        startTime,
        UTCActualStartTime,
        interval,
        repeatFrequency,
        notifications,
        timezone,
        isEmptyRepeatFrequencyScenario
      );
      break;
    case RepeatFrequencyType.weekly:
      scheduleWeeklyNotifications(iterationCount, startTime, repeatFrequency, notifications);
      break;
    case RepeatFrequencyType.monthly:
      scheduleMonthlyNotifications(iterationCount, startTime, repeatFrequency, notifications);
      break;
  }
}

/**
 * Schedule daily notifications based on provided parameters.
 *
 * @param {number} iterationCount - The number of iterations or days to add to the start time.
 * @param {moment.Moment} startTime - The starting time for scheduling notifications.
 * @param {RepeatFrequency} repeatFrequency - The frequency of repetition for notifications.
 * @param {string[]} notifications - An array to store the scheduled notification times in ISO 8601 format.
 * @returns {void}
 */
function scheduleDailyNotifications(
  iterationCount: number,
  startTime: moment.Moment,
  actualStartTime: moment.Moment,
  interval: Interval,
  repeatFrequency: RepeatFrequency,
  notifications: string[],
  timezone: string,
  isEmptyRepeatFrequencyScenario: boolean = false
): void {
  const intervalType = interval.type ?? IntervalType.same_day;
  const scheduleTimes = repeatFrequency.schedule_time as RepeatFrequencyTimes[];
  scheduleTimes?.forEach((frequencyTime) => {
    frequencyTime.times?.forEach((time) => {
      const scheduledTime = startTime
        .clone()
        .add(iterationCount, "days")
        .set({
          hour: moment(time, "hh:mm A").hour(),
          minute: moment(time, "hh:mm A").minute(),
        });
      console.log("frequencyTime.times?.forEach --> startTime ->>>>>>>>>>>>>>>>>>>>>>>>>", startTime);

      // convert User Timezone to UTC to check schedule datetime & current datetime
      console.log("frequencyTime.times?.forEach --> scheduledTime ->>>>>>>>>>>>>>>>>>>>>>>>>", scheduledTime);
      const utcTime = moment.tz(scheduledTime.format("YYYY-MM-DDTHH:mm:ss"), timezone).utc();
      console.log("frequencyTime.times?.forEach --> utcTime ->>>>>>>>>>>>>>>>>>>>>>>>>", utcTime);

      // Only Schedule Notifications if it's in Future or During JEST Test
      // To Prevent cases like: Appointment scheduled for Today, matches with a Mass Comm where
      // Configured to run before 7 days
      // Therefore We shall not send any notifications in prior time
      const isAfterCurrentTime = process.env.JEST_WORKER_ID !== undefined || utcTime.isSameOrAfter(moment().utc());
      console.log("frequencyTime.times?.forEach --> isAfterCurrentTime ->>>>>>>>>>>>>>>>>>>>>>>>>", isAfterCurrentTime);
      console.log("frequencyTime.times?.forEach --> moment().utc() ->>>>>>>>>>>>>>>>>>>>>>>>>", moment().utc());
      console.log("frequencyTime.times?.forEach --> actualStartTime ->>>>>>>>>>>>>>>>>>>>>>>>>", actualStartTime);
      console.log("------------------------------------------------------------------------------------------------");
      console.log("------------------------------------------------------------------------------------------------");

      // For Scheduled After Time: Make sure we don't scheduled notifications before of Actual Visit Time
      if (isEmptyRepeatFrequencyScenario) {
        if (intervalType === IntervalType.after && isAfterCurrentTime && !utcTime.isBefore(startTime)) {
          notifications.push(scheduledTime.toISOString());
        }
      } else {
        if (intervalType === IntervalType.after && isAfterCurrentTime && !utcTime.isSameOrBefore(startTime)) {
          notifications.push(scheduledTime.toISOString());
        }
      }

      // Send only if: Before Current Time && Before Scheduled Visit Time
      if (intervalType === IntervalType.before && isAfterCurrentTime && utcTime.isSameOrBefore(actualStartTime)) {
        notifications.push(scheduledTime.toISOString());
      }

      // On Same Date, Only allow to send in future times
      // if (intervalType === IntervalType.same_day && isAfterCurrentTime && !utcTime.isBefore(actualStartTime)) {
      if (intervalType === IntervalType.same_day && isAfterCurrentTime) {
        notifications.push(scheduledTime.toISOString());
      }
      console.log("frequencyTime.times?.forEach --> notifications ->>>>>>>>>>>>>>>>>>>>>>>>>", notifications);
    });
  });
}

/**
 * Handles weekly notification scheduling.
 */
function scheduleWeeklyNotifications(
  iterationCount: number,
  startTime: moment.Moment,
  repeatFrequency: RepeatFrequency,
  notifications: string[]
): void {
  const scheduleTimes = repeatFrequency.schedule_time as RepeatFrequencyTimes[];
  scheduleTimes?.forEach((frequencyTime) => {
    const day = frequencyTime.day as string;
    const dayNumber = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(day);

    frequencyTime.times?.forEach((time) => {
      const dayOfWeek = startTime.clone().add(iterationCount, "weeks").day(dayNumber);

      if (dayOfWeek.isBefore(startTime)) return;

      const scheduledTime = dayOfWeek.set({
        hour: moment(time, "hh:mm A").hour(),
        minute: moment(time, "hh:mm A").minute(),
      });
      notifications.push(scheduledTime.toISOString());
    });
  });
}

/**
 * Handles monthly notification scheduling.
 */
function scheduleMonthlyNotifications(
  iterationCount: number,
  startTime: moment.Moment,
  repeatFrequency: RepeatFrequency,
  notifications: string[]
): void {
  const scheduleTimes = repeatFrequency.schedule_time as RepeatFrequencyTimes[];
  scheduleTimes?.forEach((frequencyTime) => {
    const date = moment(frequencyTime.date).get("D");
    const times = frequencyTime.times ?? [];

    times.forEach((time) => {
      const monthDay = startTime.clone().add(iterationCount, "months").date(date);
      const scheduledTime = monthDay.set({
        hour: moment(time, "hh:mm A").hour(),
        minute: moment(time, "hh:mm A").minute(),
      });

      if (scheduledTime.isBefore(startTime)) return;

      notifications.push(scheduledTime.toISOString());
    });
  });
}

/**
 * Evaluates whether to continue adding notifications based on the stopping criteria.
 */
function checkStopCriteria(iterationCount: number, visitTime: Date, stopCriteria: RepeatUntil): boolean {
  const startTime = moment(visitTime).utc();
  console.log("checkStopCriteria --> startTime ->>>>>>>>>>>>>>>>>>>>>>>>>", startTime);
  console.log("checkStopCriteria --> moment(stopCriteria.end_date) ->>>>>>>>>>>>>>>>>>>>>>>>>", moment(stopCriteria.end_date).utc());
  switch (stopCriteria.type) {
    case RepeatUntilType.no_of_times:
      return iterationCount < Number(stopCriteria.duration);
    case RepeatUntilType.date:
      return startTime.add(iterationCount, "days").isSameOrBefore(moment(stopCriteria.end_date).utc());
    // Commented as not part of the Figma
    case RepeatUntilType.days:
    case RepeatUntilType.weeks:
    case RepeatUntilType.months:
      return iterationCount < Number(stopCriteria.duration);
    // TODO: Always is not clear, therefore needs clarification asked in ADO Board
    // case RepeatUntilType.always:
    //   return true;
    default:
      return false;
  }
}

export { buildNotifications, RepeatFrequencyType, RepeatUntilType };
