
export default class Concurrency {
  
    maxConcurrency : number = 1;
  
    
    activeWorkers : number = 0;
  
    
    private jobQueue : Function[] = [];
  
   
    private waiting : Function[] = [];
  
  
    constructor(maxConcurrency: number) {
      this.maxConcurrency = maxConcurrency;
    }
  
   
    private runNextJob() : void {
      const job = this.jobQueue.pop();
  
      if (job) {
        // console.debug("Running a job...");
        job().then(() => {
          // console.debug("Job finished, running the next waiting job...");
          this.runNextJob();
        });
      } else {
        // console.debug("No waiting job found!");
        this.activeWorkers -= 1;
        if (this.activeWorkers === 0) {
          // console.debug("This concurrency manager is idle!");
          this.waiting.forEach((x) => x());
        }
      }
    }
  
   
    addJob(job: () => Promise<any>) : void {
      // console.debug("Adding a worker!");
      this.jobQueue.push(job);
  
      if (!this.maxConcurrency || this.activeWorkers < this.maxConcurrency) {
        this.runNextJob();
        this.activeWorkers += 1;
      } else {
        // console.debug("No capacity to run a worker now, waiting!");
      }
    }
  
   
    waitForCompletion() : Promise<void> {
      return new Promise((res) => {
        this.waiting.push(res);
      });
    }
  }