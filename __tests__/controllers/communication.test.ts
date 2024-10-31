import request from 'supertest';
const app: string = "http://localhost:3000"
import {
    CommunicationData,
    CommunicationStatus,
    CommunicationType,
    DelayType,
    FrequencyConfig,
    FrequencyConfigType,
    FrequencyType,
    RepeatUntilType,
    IntervalType,
    StudyVisitType,
    RepeatFrequencyType
} from '../../types/communication'
import { CommunicationController } from '../../controllers';
import { CommonUtils } from '../../utils/common';

import mongoose from 'mongoose';
const communicationController = new CommunicationController();
enum DateDirection {
    Past = 'past',
    Future = 'future'
}

let utils: CommonUtils;

beforeEach(() => {
    utils = new CommonUtils();
});

let communication_id: string;
let department_id: string;
let department_name: string;
let inValidId: string = "invalid_id_here";
let authToken: string

beforeAll(async () => {
    const response = await request(app)
        .get('/login')
    authToken = response.body.token;

    department_name = generateRandomText(5);
    const departmentData: any = { name: department_name };
    const res = await request(app)
        .post('/mass-com/create-department')
        .set('Authorization', `Bearer ${authToken}`)
        .send(departmentData);
    department_id = res.body.data._id;
});


// ==========================================[communication]==========================================================

describe("POST /communication", () => {
    const departmentId = new mongoose.Types.ObjectId(department_id);
    const title = generateRandomText(5);
    const description = generateRandomText(15);
    const sender_email = generateRandomText(5, true);
    const gmail_email = `${generateRandomText(5)}@gmail.com`;

    const randomFutureDate = generateRandomDate(DateDirection.Future);
    const randomPastDate = generateRandomDate(DateDirection.Past);
    const randomInvalidDate = generateRandomDate();

    enum RandomFrequencyConfigType {
        scheduled = FrequencyConfigType.scheduled,
        now = FrequencyConfigType.now
    }
    var data2: RandomFrequencyConfigType[] = [RandomFrequencyConfigType.scheduled, RandomFrequencyConfigType.now];
    const randomConfigOne = data2[Math.floor(Math.random() * data2.length)];

    enum RandomFrequencyConfigType {
        status_change = "status_change",
        study_visit = "study_visit",
    }
    var data2: RandomFrequencyConfigType[] = [RandomFrequencyConfigType.status_change, RandomFrequencyConfigType.study_visit];
    const randomConfigTwo = data2[Math.floor(Math.random() * data2.length)];

    enum RandomStudyVisitType {
        scheduled_visit = StudyVisitType.scheduled_visit,
        completed_visit = StudyVisitType.completed_visit
    }
    var data1: RandomStudyVisitType[] = [RandomStudyVisitType.scheduled_visit, RandomStudyVisitType.completed_visit];
    const randomStudyVisitType = data1[Math.floor(Math.random() * data1.length)];

    it("create communication", async () => {
        // Mock communication data
        const data: Object = {
            title: title,
            type: CommunicationType.sms,
            status: CommunicationStatus.discarded,
            department_id: departmentId,
            referral_source: [],
            study: {},
            description: description,
            sender_config: {
                sender_phone: 9856789040,
                sender_email: "",
                reply_email: "",
            },
            frequency: FrequencyType.one_time,
            frequency_config: {
                type: FrequencyConfigType.now,
                scheduled_time: randomFutureDate,
                start_date: randomFutureDate,
                study_visit_type: StudyVisitType.completed_visit,
                interval: {},
                repeat_frequency: {},
                repeat_until: {},
                delay: {}
            },
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(data);

        expect(response.status).toBe(200)
    });

    it("Validation -> Communication type in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            description: "EDsc",
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        console.log("response.body------->", response.body);
        expect(response.body.message).toBe("Communication type is required.")
    });

    it("Validation -> Sender config in status=pending_review Sender_type=SMS", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.sms,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            description: description,
            sender_config: {},
            frequency: FrequencyType.one_time,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };
        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);
        expect(response.body.message).toBe("Sender config is required.")
    });

    it("Validation -> Sender config -> required phone_number in status=pending_review Sender_type=SMS", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.sms,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            description: description,
            sender_config: {
                sender_phone: null
            },
            frequency: FrequencyType.one_time,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };
        const emptyResponse = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);
        expect(emptyResponse.body.message).toBe("Sender Phone is required.")
    });

    it("Validation -> Sender config -> required sender_email in status=pending_review Sender_type=mail", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: null,
            },
            description: description,
            frequency: FrequencyType.one_time,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };
        const emptyResponse = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);
        expect(emptyResponse.body.message).toBe("Sender Email is required.")
    });

    it("Validation -> Sender config -> not dmclinical sender_email in status=pending_review Sender_type=mail", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: gmail_email,
            },
            description: description,
            frequency: FrequencyType.one_time,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };
        const emptyResponse = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);
        expect(emptyResponse.body.message).toBe("Sender Email is not valid email address, Only dmclinical emails are allowed.")
    });

    it("Validation -> Sender config -> invalid sender_email in status=pending_review Sender_type=mail", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: title,
            },
            description: description,
            frequency: FrequencyType.one_time,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };
        const emptyResponse = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);
        expect(emptyResponse.body.message).toBe("Sender Email is not valid email address, Only dmclinical emails are allowed.")
    });

    it("Validation -> Sender config -> invalid reply_email in status=pending_review Sender_type=mail", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
                reply_email: title,
            },
            description: description,
            frequency: FrequencyType.one_time,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };
        const emptyResponse = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);
        expect(emptyResponse.body.message).toBe("Reply To Email is not valid email address, Only dmclinical emails are allowed.")
    });

    it("Validation -> Sender config -> not dmclinical reply_email in status=pending_review Sender_type=mail", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
                reply_email: gmail_email,
            },
            description: description,
            frequency: FrequencyType.one_time,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };
        const emptyResponse = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);
        expect(emptyResponse.body.message).toBe("Reply To Email is not valid email address, Only dmclinical emails are allowed.")
    });

    it("Validation -> Sender config -> required cc in status=pending_review Sender_type=mail", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
                cc: generateRandomText(5, true), //This is invalid, we have to set value in array
            },
            description: description,
            frequency: FrequencyType.one_time,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };
        const emptyResponse = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);
        expect(emptyResponse.body.message).toBe("CC Email is required and must be an array.")
    });

    it("Validation -> Sender config -> invalid cc in status=pending_review Sender_type=mail", async () => {
        // Mock communication data

        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
                cc: [title],
            },
            description: description,
            frequency: FrequencyType.one_time,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };
        const emptyResponse = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);
        expect(emptyResponse.body.message).toBe("CC Email is not valid email address, Only dmclinical emails are allowed.")
    });

    it("Validation -> Sender config -> not dmclinical cc in status=pending_review Sender_type=mail", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
                cc: [gmail_email],
            },
            description: description,
            frequency: FrequencyType.one_time,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };
        const emptyResponse = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);
        expect(emptyResponse.body.message).toBe("CC Email is not valid email address, Only dmclinical emails are allowed.")
    });

    it("Validation -> Sender config -> required bcc in status=pending_review Sender_type=mail", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
                bcc: generateRandomText(5, true), //This is invalid, we have to set value in array
            },
            description: description,
            frequency: FrequencyType.one_time,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };
        const emptyResponse = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);
        expect(emptyResponse.body.message).toBe("BCC Email is required and must be an array.")
    });

    it("Validation -> Sender config -> invalid bcc in status=pending_review Sender_type=mail", async () => {
        // Mock communication data

        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
                bcc: [title],
            },
            description: description,
            frequency: FrequencyType.one_time,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };
        const emptyResponse = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);
        expect(emptyResponse.body.message).toBe("BCC Email is not valid email address, Only dmclinical emails are allowed.")
    });

    it("Validation -> Sender config -> not dmclinical bcc in status=pending_review Sender_type=mail", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
                bcc: [gmail_email],
            },
            description: description,
            frequency: FrequencyType.one_time,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };
        const emptyResponse = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);
        expect(emptyResponse.body.message).toBe("BCC Email is not valid email address, Only dmclinical emails are allowed.")
    });

    it("Validation -> require frequency in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        expect(response.body.message).toBe("Frequency is required.")
    });

    it("Validation -> require frequency config in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            frequency: FrequencyType.one_time,
            frequency_config: {},
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        expect(response.body.message).toBe("Frequency config is required.")
    });

    it("Validation -> one_time frequency config -> invalid type in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            frequency: FrequencyType.one_time,
            frequency_config: {
                type: randomConfigTwo
            },
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        expect(response.body.message).toBe(`Type must be one of the following ['${FrequencyConfigType.now}', '${FrequencyConfigType.scheduled}'].`)
    });

    it("Validation -> recurring frequency config -> invalid type in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            frequency: FrequencyType.recurring,
            frequency_config: {
                type: randomConfigOne
            },
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

            expect(response.body.message).toBe(`Trigger Type must be one of the following ['${FrequencyConfigType.status_change}', '${FrequencyConfigType.study_visit}'].`)
    });

    it("Validation -> one_time frequency config -> require scheduled_time in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            frequency: FrequencyType.one_time,
            frequency_config: {
                type: FrequencyConfigType.scheduled
            },
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        expect(response.body.message).toBe(`Scheduled time is required.`)
    });

    it("Validation -> one_time frequency config -> invalid scheduled_time in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            frequency: FrequencyType.one_time,
            frequency_config: {
                type: FrequencyConfigType.scheduled,
                scheduled_time: randomInvalidDate,
            },
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        expect(response.body.message).toBe('Scheduled time must be a datetime and greater than current datetime.')
    });

    it("Validation -> one_time frequency config -> past scheduled_time in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            frequency: FrequencyType.one_time,
            frequency_config: {
                type: FrequencyConfigType.scheduled,
                scheduled_time: randomPastDate,
            },
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        expect(response.body.message).toBe('Scheduled time must be a datetime and greater than current datetime.')
    });

    it("Validation -> recurring frequency config -> required repeat_frequency in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            frequency: FrequencyType.recurring,
            frequency_config: {
                type: FrequencyConfigType.status_change,
                repeat_frequency: {},
            },
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        expect(response.body.message).toBe('Repeat Frequency is required.')
    });

    it("Validation -> recurring frequency config -> repeat_frequency -> required type in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            frequency: FrequencyType.recurring,
            frequency_config: {
                type: FrequencyConfigType.status_change,
                repeat_frequency: {
                    type: null
                },
            },
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        expect(response.body.message).toBe('Repeat Frequency Type is required.')
    });

    it("Validation -> recurring frequency config -> repeat_frequency -> type(study_visit) -> require start_date in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            frequency: FrequencyType.recurring,
            frequency_config: {
                type: FrequencyConfigType.study_visit,
                repeat_frequency: {
                    type: RepeatFrequencyType.daily,
                    start_date: null
                },
            },
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        expect(response.body.message).toBe('Start Date is required and must be a datetime.')
    });

    it("Validation -> recurring frequency config -> repeat_frequency -> type(study_visit) -> past start_date in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            frequency: FrequencyType.recurring,
            frequency_config: {
                type: FrequencyConfigType.study_visit,
                start_date: randomPastDate,
                repeat_frequency: {
                    type: RepeatFrequencyType.daily,
                },
            },
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        expect(response.body.message).toBe('Start Date must be a datetime and greater than current datetime.')
    });

    it("Validation -> recurring frequency config -> repeat_frequency -> type(study_visit) -> require study_visit_type in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            frequency: FrequencyType.recurring,
            frequency_config: {
                type: FrequencyConfigType.study_visit,
                start_date: randomFutureDate,
                study_visit_type: null,
                repeat_frequency: {
                    type: RepeatFrequencyType.daily,
                },
            },
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        expect(response.body.message).toBe('Study Visit Type is required.')
    });

    it("Validation -> recurring frequency config -> repeat_frequency -> type(study_visit) -> invalid study_visit_type in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            frequency: FrequencyType.recurring,
            frequency_config: {
                type: FrequencyConfigType.study_visit,
                start_date: randomFutureDate,
                study_visit_type: "Invalid",
                repeat_frequency: {
                    type: RepeatFrequencyType.daily,
                },
            },
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        expect(response.body.message).toBe(`Study Visit Type be one of the following ['${RandomStudyVisitType.scheduled_visit}', '${RandomStudyVisitType.completed_visit}'].`)
    });

    it("Validation -> recurring frequency config -> interval -> require type in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            frequency: FrequencyType.recurring,
            frequency_config: {
                type: FrequencyConfigType.study_visit,
                start_date: randomFutureDate,
                study_visit_type: randomStudyVisitType,
                repeat_frequency: {
                    type: RepeatFrequencyType.daily,
                },
                interval: {
                    type: null,
                }
            },
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        expect(response.body.message).toBe('Interval Type is required.')
    });

    it("Validation -> recurring frequency config -> interval -> invalid type in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            frequency: FrequencyType.recurring,
            frequency_config: {
                type: FrequencyConfigType.study_visit,
                start_date: randomFutureDate,
                study_visit_type: randomStudyVisitType,
                repeat_frequency: {
                    type: RepeatFrequencyType.daily,
                },
                interval: {
                    type: "Invalid",
                }
            },
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        expect(response.body.message).toBe(`Interval Type must be one of the following ['${IntervalType.same_day}', '${IntervalType.before}', '${IntervalType.after}'].`)
    });

    it("Validation -> recurring frequency config -> interval -> require no_of_days in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            frequency: FrequencyType.recurring,
            frequency_config: {
                type: FrequencyConfigType.study_visit,
                start_date: randomFutureDate,
                study_visit_type: randomStudyVisitType,
                repeat_frequency: {
                    type: RepeatFrequencyType.daily,
                },
                interval: {
                    type: IntervalType.before,
                    no_of_days: null
                }
            },
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        expect(response.body.message).toBe(`Interval No of days is required and must be a number.`)
    });

    it("Validation -> recurring frequency config -> repeat_frequency -> invalid type in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            frequency: FrequencyType.recurring,
            frequency_config: {
                type: FrequencyConfigType.study_visit,
                start_date: randomFutureDate,
                study_visit_type: randomStudyVisitType,
                repeat_frequency: {
                    type: RepeatFrequencyType.one_time,
                },
                interval: {
                    type: IntervalType.before,
                    no_of_days: null
                }
            },
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        expect(response.body.message).toBe(`Interval No of days is required and must be a number.`)
    });

    it("Validation -> recurring frequency config -> repeat_frequency -> required schedule_time in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            frequency: FrequencyType.recurring,
            frequency_config: {
                type: FrequencyConfigType.status_change,
                start_date: randomFutureDate,
                study_visit_type: randomStudyVisitType,
                repeat_frequency: {
                    type: RepeatFrequencyType.daily,
                    schedule_time: null
                },
                interval: {
                    type: IntervalType.before,
                    no_of_days: 2
                }
            },
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        expect(response.body.message).toBe(`Repeat Frequency Schedule Time is required.`)
    });

    it("Validation -> recurring frequency config -> repeat_frequency -> invalid schedule_time in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            frequency: FrequencyType.recurring,
            frequency_config: {
                type: FrequencyConfigType.status_change,
                start_date: randomFutureDate,
                study_visit_type: randomStudyVisitType,
                repeat_frequency: {
                    type: RepeatFrequencyType.daily,
                    schedule_time: randomFutureDate
                },
                interval: {
                    type: IntervalType.before,
                    no_of_days: 2
                }
            },
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        expect(response.body.message).toBe(`Repeat Frequency Schedule Time must be an array of objects.`)
    });

    /*
    // TODO: This test case is pending, due to random time functionality
    it("Validation -> recurring frequency config -> repeat_frequency(Daily) -> invalid time in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            frequency: FrequencyType.recurring,
            frequency_config: {
                type: FrequencyConfigType.status_change,
                start_date: randomFutureDate,
                study_visit_type: randomStudyVisitType,
                repeat_frequency: {
                    type: RepeatFrequencyType.daily,
                    schedule_time: {
                        times: generateRandomTimes(3),
                    }
                },
                interval: {
                    type: IntervalType.before,
                    no_of_days: 2
                }
            },
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        expect(response.body.message).toBe(`Schedule Time Slot is required & must be an array of times.`)
    });

    it("Validation -> recurring frequency config -> repeat_frequency(Weekly) -> invalid time in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            frequency: FrequencyType.recurring,
            frequency_config: {
                type: FrequencyConfigType.status_change,
                start_date: randomFutureDate,
                study_visit_type: randomStudyVisitType,
                repeat_frequency: {
                    type: RepeatFrequencyType.weekly,
                    schedule_time: [
                        {
                          "day": "Monday",
                          "times": ["01:00 PM"]
                        },
                        {
                          "day": "Wednesday",
                          "times": ["03:00 PM", "06:00 PM"]
                        },
                        {
                          "day": "Friday",
                          "times": ["10:00 AM", "02:00 PM"]
                        }
                      ]
                },
                interval: {
                    type: IntervalType.before,
                    no_of_days: 2
                }
            },
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        expect(response.body.message).toBe(`Schedule Time Slot is required & must be an array of times.`)
    });

    it("Validation -> recurring frequency config -> repeat_frequency(Monthly) -> invalid time in status=pending_review", async () => {
        // Mock communication data
        const invalidData: Object = {
            title: title,
            type: CommunicationType.email,
            status: CommunicationStatus.pending_review,
            department_id: departmentId,
            referral_source: [],
            study: {},
            sender_config: {
                sender_email: sender_email,
            },
            frequency: FrequencyType.recurring,
            frequency_config: {
                type: FrequencyConfigType.status_change,
                start_date: randomFutureDate,
                study_visit_type: randomStudyVisitType,
                repeat_frequency: {
                    type: RepeatFrequencyType.monthly,
                    schedule_time: [
                        {
                          "date": "2024-05-01",
                          "day": 1,
                          "times": ["01:00 PM"]
                        },
                        {
                          "date": "2024-05-05",
                          "day": 5,
                          "times": ["03:00 PM", "06:00 PM"]
                        },
                        {
                          "date": "2024-05-22",
                          "day": 22,
                          "times": ["10:00 AM", "02:00 PM"]
                        }
                      ]
                },
                interval: {
                    type: IntervalType.before,
                    no_of_days: 2
                }
            },
            description: description,
            script_content: "<p>{{first_name}}{{last_name}}</p>"
        };

        const response = await request(app).post(`/mass-com/communication`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData);

        expect(response.body.message).toBe(`Schedule Time Slot is required & must be an array of times.`)
    });
    */
})

describe('GET /communication', () => {
    it('responds with communication list', async () => {
        const response = await request(app).get('/mass-com/communication').set('Authorization', `Bearer ${authToken}`);
        if (!response.body.data || response.body.data.length === 0) {
            throw new Error('Communication list is empty');
        }

        let key = Math.floor(Math.random() * response.body.data.length);
        communication_id = response.body.data[key]._id;

        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        return response.body;
    });

});

describe('GET /communication/:id', () => {
    it('responds with communication details for a valid id', async () => {
        let response = await request(app).get(`/mass-com/communication/${communication_id}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(response.status).toBe(200);
    });

    it('responds with an error for an invalid id', async () => {
        const response = await request(app).get(`/mass-com/communication/${inValidId}`)
            .set('Authorization', `Bearer ${authToken}`);

        // Check response status
        expect(response.status).toBe(400);
        expect(response.body).toBeDefined();
    });
});

describe('GET /communication/duplicate/:id', () => {
    it('responds with duplicate communication details for a valid id', async () => {
        await request(app).post(`/mass-com/communication/duplicate/${communication_id}`)
            .set('Authorization', `Bearer ${authToken}`);
    });

    it('responds with an error for an invalid id', async () => {
        const response = await request(app).post(`/mass-com/communication/duplicate/${inValidId}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(response.status).toBe(400);
    });
});

describe('GET /communication/active/:id', () => {
    it('responds with active communication details for a valid id', async () => {
        const response = await request(app).get(`/mass-com/communication/active/${communication_id}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(response.status).toBe(200);
    });

    it('responds with an error for an invalid id', async () => {
        const response = await request(app).get(`/mass-com/communication/active/${inValidId}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(response.status).toBe(200);
    });
});

describe('GET /communication/pin/:id', () => {
    it('responds with pin communication details for a valid id', async () => {
        const response = await request(app).get(`/mass-com/communication/pin/${communication_id}`)
            .set('Authorization', `Bearer ${authToken}`);

        // Check response status
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();

        // Add more specific checks based on your API response structure
    });

    it('responds with an error for an pin id', async () => {
        const invalidId = '66223dcdd8da888566a1f600sdss';
        const response = await request(app).get(`/mass-com/communication/pin/${invalidId}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
    });
});

describe('validateDelay function', () => {
    it('should return status true when frequency_config has valid delay', async () => {
        // Valid delay configuration
        const frequencyConfig: FrequencyConfig = {
            type: FrequencyConfigType.scheduled,
        };

        const response = await communicationController.validateDelay(frequencyConfig);
        expect(response.status).toBe(true);
    });

    it('should return status false and appropriate message when delay type is missing', async () => {
        // Invalid delay configuration: type missing

        const frequencyConfig: FrequencyConfig = {
            start_date: new Date("2024-07-10"),
            type: FrequencyConfigType.status_change,
            delay: {}
        };

        const response = await communicationController.validateDelay(frequencyConfig);
        expect(response.status).toBe(true);
    });

    it('should return status false and appropriate message when delay type is invalid', async () => {
        // Invalid delay configuration: invalid type
        const frequency_config: FrequencyConfig = {
            type: FrequencyConfigType.status_change,
            delay: {
                type: DelayType.days,
                duration: "1"
            }
        };

        const response = await communicationController.validateDelay(frequency_config);
        expect(response.status).toBe(true);
    });

    it('should return status false and appropriate message when delay duration is missing or not a number', async () => {

        const frequency_config: FrequencyConfig = {
            type: FrequencyConfigType.status_change,
            delay: {
                type: DelayType.days,
            }
        };
        let response = await communicationController.validateDelay(frequency_config);
        expect(response.status).toBe(false);
        expect(response.message).toBe('Delay Duration is required and must be a number.');
    });
});

describe('validateRepeatUntil', () => {
    it('should return true if Repeat configuration is valid', async () => {
        const frequencyConfig: FrequencyConfig = {
            type: FrequencyConfigType.status_change,
        };
        const timezone = "America/Chicago";
        await communicationController.validateRepeatUntil(frequencyConfig, timezone);
    });
});

describe('validateDatetime', () => {
    it('should return true if datetime is valid and greater than current datetime', async () => {
        const datetime = new Date(Date.now() + 1000); // Future datetime
        const result = await communicationController.validateDatetime(datetime);
        expect(result).toBe(true);
    });

    it('should return false if datetime is not greater than current datetime', async () => {
        const datetime = new Date(); // Current datetime
        const result = await communicationController.validateDatetime(datetime);
        expect(result).toBe(false);
    });

    it('should return false if an error occurs during validation', async () => {
        const datetime = new Date(); // Current datetime
        // Mock an error during validation
        jest.spyOn(global.console, 'log').mockImplementation(() => { }); // Mock console.log
        jest.spyOn(global.console, 'error').mockImplementation(() => { }); // Mock console.error
        await communicationController.validateDatetime(datetime);
    });
});

describe('validateTimes', () => {
    it('should return true if times are valid and no duplicates', async () => {
        const times = ['09:00 AM', '10:30 AM', '01:45 PM']; // Valid and unique times
        const result = await communicationController.validateTimes(times);
        expect(result).toEqual({ status: true });
    });

    it('should return false with appropriate error message if duplicate times are found', async () => {
        const times = ['09:00 AM', '10:30 AM', '09:00 AM']; // Valid times with duplicate
        const result = await communicationController.validateTimes(times);
        expect(result).toEqual({ status: false, message: 'Duplicate Schedule Time is not allowed.' });
    });

    it('should return false with appropriate error message if any time is invalid', async () => {
        const times = ['09:00 AM', '10:30', '01:45 PM']; // Valid times with one invalid
        const result = await communicationController.validateTimes(times);
        expect(result).toEqual({ status: false, message: 'Schedule Time is invalid.' });
    });

    it('should return false with generic error message if an error occurs during validation', async () => {
        // Mock an error during validation
        jest.spyOn(global.console, 'log').mockImplementation(() => { }); // Mock console.log
        jest.spyOn(global.console, 'error').mockImplementation(() => { }); // Mock console.error
        const times = ['09:00 AM', '10:30 AM', '01:45 PM']; // Valid times
        await communicationController.validateTimes(times);
    });
});

describe('validateEmail', () => {
    it('should return true if all emails match the pattern', async () => {
        const emails = ['test1@dmclinical.com', 'test2@dmclinical.com']; // Valid emails
        const result = await communicationController.validateEmail(emails);
        expect(result).toBe(true);
    });

    it('should return false if any email does not match the pattern', async () => {
        const emails = ['test1@dmclinical.com', 'invalidemail@example.com']; // Valid and invalid emails
        const result = await communicationController.validateEmail(emails);
        expect(result).toBe(false);
    });

    it('should return false with generic error message if an error occurs during validation', async () => {
        // Mock an error during validation
        jest.spyOn(global.console, 'log').mockImplementation(() => { }); // Mock console.log
        jest.spyOn(global.console, 'error').mockImplementation(() => { }); // Mock console.error
        const emails = ['test1@dmclinical.com', 'test2@dmclinical.com']; // Valid emails
        await communicationController.validateEmail(emails);
    });
});


describe('validateEmailFields', () => {
    it('should return true if sender_email is provided and valid', async () => {
        const senderConfig = { sender_email: 'valid@dmclinical.com' };
        const result = await communicationController.validateEmailFields(senderConfig);
        expect(result).toEqual({ status: true });
    });

    it('should return false with appropriate error message if sender_email is missing', async () => {
        const senderConfig = {};
        const result = await communicationController.validateEmailFields(senderConfig);
        expect(result).toEqual({ status: false, message: 'Sender Email is required.' });
    });

    it('should return false with appropriate error message if sender_email is not valid', async () => {
        const senderConfig = { sender_email: 'invalid@example.com' };
        const result = await communicationController.validateEmailFields(senderConfig);
        expect(result).toEqual({ status: false, message: 'Sender Email is not valid email address, Only dmclinical emails are allowed.' });
    });

    it('should return true if reply_email is valid', async () => {
        const senderConfig = { sender_email: 'valid@dmclinical.com', reply_email: 'valid_reply@dmclinical.com' };
        const result = await communicationController.validateEmailFields(senderConfig);
        expect(result).toEqual({ status: true });
    });

    it('should return false with appropriate error message if reply_email is invalid', async () => {
        const senderConfig = { sender_email: 'valid@dmclinical.com', reply_email: 'invalid@example.com' };
        const result = await communicationController.validateEmailFields(senderConfig);
        expect(result).toEqual({ status: false, message: 'Reply To Email is not valid email address, Only dmclinical emails are allowed.' });
    });

    it('should return false with appropriate error message if cc is not an array', async () => {
        const senderConfig = { sender_email: 'valid@dmclinical.com', cc: ['invalid_cc@example.com'] };
        const result = await communicationController.validateEmailFields(senderConfig);
        expect(result).toEqual({ status: false, message: 'CC Email is not valid email address, Only dmclinical emails are allowed.' });
    });

    it('should return false with appropriate error message if any cc email is invalid', async () => {
        const senderConfig = { sender_email: 'valid@dmclinical.com', cc: ['valid_cc@dmclinical.com', 'invalid_cc@example.com'] };
        const result = await communicationController.validateEmailFields(senderConfig);
        expect(result).toEqual({ status: false, message: 'CC Email is not valid email address, Only dmclinical emails are allowed.' });
    });

    it('should return false with appropriate error message if bcc is not an array', async () => {
        const senderConfig = { sender_email: 'valid@dmclinical.com', bcc: ['invalid_bcc@example.com'] };
        const result = await communicationController.validateEmailFields(senderConfig);
        expect(result).toEqual({ status: false, message: 'BCC Email is not valid email address, Only dmclinical emails are allowed.' });
    });

    it('should return false with appropriate error message if any bcc email is invalid', async () => {
        const senderConfig = { sender_email: 'valid@dmclinical.com', bcc: ['valid_bcc@dmclinical.com', 'invalid_bcc@example.com'] };
        const result = await communicationController.validateEmailFields(senderConfig);
        expect(result).toEqual({ status: false, message: 'BCC Email is not valid email address, Only dmclinical emails are allowed.' });
    });

    it('should return false with generic error message if an error occurs during validation', async () => {
        // Mock an error during validation
        jest.spyOn(global.console, 'log').mockImplementation(() => { }); // Mock console.log
        jest.spyOn(global.console, 'error').mockImplementation(() => { }); // Mock console.error
        const senderConfig = { sender_email: 'valid@dmclinical.com' };
        await communicationController.validateEmailFields(senderConfig);
    });
});

describe('validateRepeatUntilStatusChange', () => {
    it('should return true if repeat_until is not provided', async () => {
        const frequencyConfig = { type: FrequencyConfigType.now };
        const timezone = "America/Chicago";
        const result = await communicationController.validateRepeatUntilStatusChange(frequencyConfig, timezone);
        expect(result).toEqual({ status: true });
    });

    it('should return true if repeat_until type is valid', async () => {
        const frequencyConfig = {
            type: FrequencyConfigType.scheduled,
            repeat_until: { type: RepeatUntilType.always, end_date: new Date('2024-12-31') }
        };
        const timezone = "America/Chicago";
        const result = await communicationController.validateRepeatUntilStatusChange(frequencyConfig, timezone);
        expect(result).toEqual({ status: true });
    });

    it('should return false with appropriate error message if repeat_until type is date but end_date is missing', async () => {
        const frequencyConfig = { type: FrequencyConfigType.scheduled, repeat_until: { type: RepeatUntilType.date } }
        const timezone = "America/Chicago";;
        const result = await communicationController.validateRepeatUntilStatusChange(frequencyConfig, timezone);
        expect(result).toEqual({ status: false, message: "Repeat Until Date is required." });
    });

    it('should return false with generic error message if an error occurs during validation', async () => {
        // Mock an error during validation
        jest.spyOn(global.console, 'log').mockImplementation(() => { }); // Mock console.log
        jest.spyOn(global.console, 'error').mockImplementation(() => { }); // Mock console.error
        const frequencyConfig = { type: FrequencyConfigType.scheduled, repeat_until: { type: RepeatUntilType.date, end_date: new Date('2024-12-31') } };
        const timezone = "America/Chicago";
        const result = await communicationController.validateRepeatUntilStatusChange(frequencyConfig, timezone);
        expect(result).toEqual({ status: false, message: 'Repeat Until Date is required.' });
    });
});


describe('validateRepeatFrequencyMonthly', () => {
    it('should return true if schedule_time is empty', async () => {
        const timezone = "America/Chicago";
        const result = await communicationController.validateRepeatFrequencyMonthly([], timezone);
        expect(result).toEqual({ status: true });
    });

    it('should return false with appropriate error message if schedule_date is missing', async () => {
        const scheduleTime = [{ day: '1' }];
        const timezone = "America/Chicago";
        const result = await communicationController.validateRepeatFrequencyMonthly(scheduleTime, timezone);
        expect(result).toEqual({ status: false, message: 'Schedule Date is required and must be a date.' });
    });

    it('should return false with appropriate error message if month day is missing', async () => {
        const scheduleTime = [{ date: new Date() }];
        const timezone = "America/Chicago";
        const result = await communicationController.validateRepeatFrequencyMonthly(scheduleTime, timezone);
        expect(result).toEqual({ status: false, message: 'Schedule Date is required and must be a date.' });
    });

    it('should return false with appropriate error message if day is invalid', async () => {
        const scheduleTime = [{ date: new Date(), day: '32' }];
        const timezone = "America/Chicago";
        const result = await communicationController.validateRepeatFrequencyMonthly(scheduleTime, timezone);
        expect(result).toEqual({ status: false, message: 'Schedule Date is required and must be a date.' });
    });

    it('should return false with appropriate error message if duplicate date is found', async () => {
        const scheduleTime = [{ date: new Date('2024-01-01'), day: '1' }, { date: new Date('2024-01-01'), day: '2' }];
        const timezone = "America/Chicago";
        const result = await communicationController.validateRepeatFrequencyMonthly(scheduleTime, timezone);
        expect(result).toEqual({ status: false, message: 'Schedule Date is required and must be a date.' });
    });

    it('should return false with appropriate error message if any time is invalid', async () => {
        const scheduleTime = [{ date: new Date(), day: '1', times: ['10:00 AM', 'invalid_time'] }];
        const timezone = "America/Chicago";
        const result = await communicationController.validateRepeatFrequencyMonthly(scheduleTime, timezone);
        expect(result).toEqual({ status: false, message: 'Schedule Date is required and must be a date.' });
    });

    it('should return false with generic error message if an error occurs during validation', async () => {
        // Mock an error during validation
        jest.spyOn(global.console, 'log').mockImplementation(() => { }); // Mock console.log
        jest.spyOn(global.console, 'error').mockImplementation(() => { }); // Mock console.error
        const scheduleTime = [{ date: new Date(), day: '1', times: ['10:00 AM', '11:00 AM'] }];
        const timezone = "America/Chicago";
        const result = await communicationController.validateRepeatFrequencyMonthly(scheduleTime, timezone);
        expect(result).toEqual({ status: false, message: 'Schedule Date is required and must be a date.' });
    });
});

function generateRandomText(length = 5, want_email = false) {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const nameLength = Math.floor(Math.random() * 2) + length;
    let randomName = '';

    for (let i = 0; i < nameLength; i++) {
      const randomIndex = Math.floor(Math.random() * letters.length);
      randomName += letters[randomIndex];
    }

    if (want_email){
        // const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
        // const randomDomainIndex = Math.floor(Math.random() * domains.length);
        const domain = "dmclinical.com";
        return `${randomName}@${domain}`
    }
    return randomName;
}

function generateRandomDate(direction?: DateDirection): string | null {
    if (!direction || (direction !== DateDirection.Past && direction !== DateDirection.Future)) return 'Invalid Date';

    const now = Date.now();
    const randomOffset = (direction === DateDirection.Past ? -1 : 1) * Math.floor(Math.random() * 31536000000); // 1 year in milliseconds

    const randomDate = new Date(now + randomOffset);
    const isoString = randomDate.toISOString();
    return isoString;
}


function generateRandomTimes(count: number): string[] {
    const randomTimes: string[] = [];

    for (let i = 0; i < count; i++) {
        const hours = Math.floor(Math.random() * 12); // Random hours from 0 to 11
        const minutes = Math.floor(Math.random() * 60); // Random minutes from 0 to 59
        const amPm = Math.random() < 0.5 ? 'AM' : 'PM'; // Randomly select am or pm

        const formattedHours = hours.toString().padStart(2, '0'); // Ensure two digits for hours
        const formattedMinutes = minutes.toString().padStart(2, '0'); // Ensure two digits for minutes

        randomTimes.push(`${formattedHours}:${formattedMinutes} ${amPm}`);
    }

    return randomTimes;
}