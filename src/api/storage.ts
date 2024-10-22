import { default as axios } from "axios";
import { WorkflowFile } from "maxun-core";
import { RunSettings } from "../components/molecules/RunSettings";
import { ScheduleSettings } from "../components/molecules/ScheduleSettings";
import { CreateRunResponse, ScheduleRunResponse } from "../pages/MainPage";

export const getStoredRecordings = async (): Promise<string[] | null> => {
  try {
    const response = await axios.get('http://localhost:8080/storage/recordings');
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Couldn\'t retrieve stored recordings');
    }
  } catch (error: any) {
    console.log(error);
    return null;
  }
};

export const getStoredRuns = async (): Promise<string[] | null> => {
  try {
    const response = await axios.get('http://localhost:8080/storage/runs');
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Couldn\'t retrieve stored recordings');
    }
  } catch (error: any) {
    console.log(error);
    return null;
  }
};

export const getStoredRecording = async (id: string) => {
  try {
    const response = await axios.get(`http://localhost:8080/storage/recordings/${id}`);
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Couldn't retrieve stored recording ${id}`);
    }
  } catch (error: any) {
    console.log(error);
    return null;
  }
}

export const deleteRecordingFromStorage = async (id: string): Promise<boolean> => {
  try {
    const response = await axios.delete(`http://localhost:8080/storage/recordings/${id}`);
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Couldn't delete stored recording ${id}`);
    }
  } catch (error: any) {
    console.log(error);
    return false;
  }
};

export const deleteRunFromStorage = async (id: string): Promise<boolean> => {
  try {
    const response = await axios.delete(`http://localhost:8080/storage/runs/${id}`);
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Couldn't delete stored recording ${id}`);
    }
  } catch (error: any) {
    console.log(error);
    return false;
  }
};

export const editRecordingFromStorage = async (browserId: string, id: string): Promise<WorkflowFile | null> => {
  try {
    const response = await axios.put(`http://localhost:8080/workflow/${browserId}/${id}`);
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Couldn't edit stored recording ${id}`);
    }
  } catch (error: any) {
    console.log(error);
    return null;
  }
};

export const createRunForStoredRecording = async (id: string, settings: RunSettings): Promise<CreateRunResponse> => {
  try {
    const response = await axios.put(
      `http://localhost:8080/storage/runs/${id}`,
      { ...settings });
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Couldn't create a run for a recording ${id}`);
    }
  } catch (error: any) {
    console.log(error);
    return { browserId: '', runId: '' };
  }
}

export const interpretStoredRecording = async (id: string): Promise<boolean> => {
  try {
    const response = await axios.post(`http://localhost:8080/storage/runs/run/${id}`);
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Couldn't run a recording ${id}`);
    }
  } catch (error: any) {
    console.log(error);
    return false;
  }
}

export const notifyAboutAbort = async (id: string): Promise<boolean> => {
  try {
    const response = await axios.post(`http://localhost:8080/storage/runs/abort/${id}`);
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Couldn't abort a running recording with id ${id}`);
    }
  } catch (error: any) {
    console.log(error);
    return false;
  }
}

export const scheduleStoredRecording = async (id: string, settings: ScheduleSettings): Promise<ScheduleRunResponse> => {
  try {
    const response = await axios.put(
      `http://localhost:8080/storage/schedule/${id}`,
      { ...settings });
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Couldn't schedule recording ${id}. Please try again later.`);
    }
  } catch (error: any) {
    console.log(error);
    return { message: '', runId: '' };
  }
}

export const getSchedule = async (id: string) => {
  try {
    const response = await axios.get(`http://localhost:8080/storage/schedule/${id}`);
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Couldn't retrieve schedule for recording ${id}`);
    }
  } catch (error: any) {
    console.log(error);
    return null;
  }
}

export const deleteSchedule = async (id: string): Promise<boolean> => {
  try {
    const response = await axios.delete(`http://localhost:8080/storage/schedule/${id}`);
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Couldn't delete schedule for recording ${id}`);
    }
  } catch (error: any) {
    console.log(error);
    return false;
  }
}