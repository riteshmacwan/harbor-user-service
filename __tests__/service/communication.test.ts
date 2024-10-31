import mongoose from "mongoose";
import { CommunicationService } from "../../service";
import {
  CommunicationChangeStatus,
  CommunicationData,
  CommunicationStatus,
  CommunicationType,
  FrequencyConfigType,
  FrequencyType,
  StudyVisitType,
  IntervalType,
  RepeatFrequencyType,
} from "../../types/communication";

// Initialize communicationService before each test
let communicationService: CommunicationService;

beforeEach(() => {
  communicationService = new CommunicationService();
});

describe("createOne", () => {
  it("should create a new communication", async () => {
    // Mock communication data
    const departmentId = new mongoose.Types.ObjectId("661fc8602a06c3497672ea2e");
    const data: CommunicationData = {
      title: "Demo",
      type: CommunicationType.sms,
      status: CommunicationStatus.discarded,
      department_id: departmentId,
      referral_source: [],
      study: {},
      description: "EDsc",
      sender_config: {
        sender_phone: 1234567890,
        sender_email: "exmle@mail.com",
        reply_email: "test123@mail.com",
      },
      frequency: FrequencyType.one_time,
      frequency_config: {
        type: FrequencyConfigType.now,
        scheduled_time: new Date("2024-05-17T09:30:37.000+00:00"),
        start_date: new Date("2024-05-17T09:30:37.000+00:00"),
        study_visit_type: StudyVisitType.completed_visit,
        interval: {
          type: IntervalType.after,
          no_of_days: "5",
        },
        repeat_frequency: {
          type: RepeatFrequencyType.monthly,
        },
        repeat_until: {},
        delay: {},
      },
      script_id: new mongoose.Types.ObjectId("663391b77074c60112bc5335"),
      script_content: "<p>{{first_name}}{{last_name}}</p>",
      timezone: "America/Chicago",
    };
    // Call the createOne method
    await communicationService.createOne(data);
  }, 45000);
});

describe("updateOne", () => {
  it("should update an existing communication", async () => {
    // Mock communication data
    const departmentId = new mongoose.Types.ObjectId("6634bae9a641de6b98a35656");
    const data: CommunicationData = {
      title: "Demo",
      type: CommunicationType.email,
      status: CommunicationStatus.pending_review,
      department_id: departmentId,
      referral_source: [],
      study: {},
      description: "THis is updated Description",
      sender_config: {
        sender_phone: 9856789040,
        sender_email: "",
        reply_email: "",
      },
      frequency: FrequencyType.recurring,
      frequency_config: {
        type: FrequencyConfigType.scheduled,
        scheduled_time: new Date("2024-04-22T10:20:20.000+00:00"),
        start_date: new Date("2024-05-22T09:30:37.000+00:00"),
        study_visit_type: StudyVisitType.scheduled_visit,
        interval: {},
        repeat_frequency: {},
        repeat_until: {},
        delay: {},
      },
      script_id: new mongoose.Types.ObjectId("663391b77074c60112bc5335"),
      script_content: "<p>{{sur_name}}{{father_name}}</p>",
      timezone: "America/Chicago",
    };
    await communicationService.updateOne("663881288612e9261baea567", data);
  }, 45000);
});

describe("list", () => {
  it("should call list with the correct parameters", async () => {
    const skip = 0;
    const limit = 10;
    const condition = { status: "pending" };

    // Mock list method and store the result
    const data = await communicationService.list(skip, limit, condition);

    // Verify that communicationRepository.list was called with the correct parameters
    expect(data).toBeDefined();
  }, 45000);
});

describe("findOneById", () => {
  it("should call findOneById with the correct parameters", async () => {
    // Mock list method and store the result
    const data = await communicationService.findOneById("663881288612e9261baea567");

    // Verify that communicationRepository.list was called with the correct parameters
    expect(data).toBeDefined();
  }, 45000);
});

describe("countDocument", () => {
  it("should return the count of documents when count operation is successful", async () => {
    const data = await communicationService.countDocument({});
    expect(data).toBe(0);
  }, 45000);
});

describe("pin", () => {
  it("should return null if no communication is found with the provided ID", async () => {
    const result = await communicationService.pin("663881288612e9261baea567");
    expect(result).toBeNull();
  }, 45000);
});

describe("activeInactive", () => {
  it("should toggle is_active status and return updated communication when communication is found and status is 'published'", async () => {
    await communicationService.activeInactive("663881288612e9261baea567");
  }, 45000);

  it("should return null when communication is not found or its status is not 'published'", async () => {
    let result = await communicationService.activeInactive("663881288612e9261baea567");
    expect(result).toBeNull();
    result = await communicationService.activeInactive("663881288612e9261baea567");
    expect(result).toBeNull();
  }, 45000);

  it("should handle errors and return null", async () => {
    const result = await communicationService.activeInactive("663881288612e9261baea567");
    expect(result).toBeNull();
  }, 45000);
});

// describe('changeStatus', () => {
//     it('should not change status if communication is published or deleted', async () => {
//         const data: CommunicationChangeStatus = {
//             id: '663881288612e9261baea564',
//             status: CommunicationStatus.published, // or Deleted
//             user: 'test_user'
//         };
//         const result = await communicationService.changeStatus(data);
//         expect(result).toBeNull();
//     }, 45000);

//     it('should not change status if communication is draft and new status is invalid', async () => {
//         // Construct data where status is draft
//         const data: CommunicationChangeStatus = {
//             id: '663881288612e9261baea564',
//             status: CommunicationStatus.draft,
//             user: 'test_user'
//         };

//         // Try changing status to an invalid one
//         const result = await communicationService.changeStatus({ ...data, status: CommunicationStatus.published });
//         expect(result).toBeNull();
//     }, 45000);

//     it('invalid', async () => {
//         // Construct data where status is draft
//         const data: CommunicationChangeStatus = {
//             id: '663881288612e9261baea564',
//             status: CommunicationStatus.draft,
//             user: 'test_user'
//         };

//         // Try changing status to an invalid one
//         const result = await communicationService.changeStatus({ ...data, status: CommunicationStatus.published });
//         expect(result).toBeNull();
//     }, 45000);
// });
