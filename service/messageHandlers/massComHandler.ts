import { ProcessCommunicationService } from "../processCommunication";
import { CommunicationService } from "../communication";

/**
 * Handles messages for mass communication events.
 * This function is responsible for processing incoming messages that trigger
 * various mass communication actions such as sending notifications, emails, or SMS
 * to a large group of patients or users.
 *
 * @param {any} message - The message object received from the service bus.
 *                        This object contains all the necessary details required
 *                        to process the mass communication.
 * @returns {Promise<void>} - A promise that resolves when the message has been
 *                            successfully processed.
 */
export async function handleMassCommHandler(message: any): Promise<void> {
  const processCommunicationService = new ProcessCommunicationService();
  const communicationService = new CommunicationService();
  console.log("Handling Mass Comm Message", message.body);
  try {
    // Validate that message has a body and a type
    if (!message.body || typeof message.body !== "object") {
      console.error("Invalid message format: No body found.");
      return;
    }

    if (typeof message.body.type !== "string") {
      console.error("Invalid message format: Type is missing or not a string.");
      return;
    }

    if (typeof message.body.data !== "object") {
      console.error("Invalid message data format: Type is missing or not an object.");
      return;
    }

    const eventData = message.body.data;

    if (typeof eventData.event !== "string") {
      console.error("Invalid event data: event name format: Type is missing or not a string.");
      return;
    }

    // Process the message based on its type
    console.log("handleMassCommHandler --> eventData.event ->>>>>>>>>>>>>>>>>>>>>>>>>", eventData.event);
    switch (eventData.event) {
      case "process-scheduled-mass-comm":
        // Done: Call Patient Pool Build Function
        console.log("eventData ==> ", eventData);
        if (!eventData["com-data"]) {
          console.error("Error: Com data not found in the event data");
          return;
        }

        console.log("Processing the Communication again in Event Handler ===> ");
        processCommunicationService.processCommunication(eventData["com-data"]);
        break;
      case "update-mass-com-hashtags": 
        await communicationService.updateOne(eventData.data.id, {hashtag: eventData.data.tag_data});
        break;
      case "send-matched-communication":
        if (!eventData["data"]) {
          console.error("Error: Com data not found in the event data for send-matched-communication");
          return;
        }
        console.log("Processing the Communication send-matched-communication ===> ");
        processCommunicationService.processMatchingCommunication(eventData["data"]);
        break;
      // Add other cases as necessary
      // case 'another-message-type':
      //     handleAnotherMessageType(message.body);
      //     break;

      default:
        console.warn(`No handler found to handle event: ${message.body.type}`);
    }
  } catch (error) {
    console.error("Error processing message:", error);
    // Optionally log error details or handle them accordingly
  }
}
