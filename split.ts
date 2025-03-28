// read in the data from data.json

// given a MAX json chunk size in bytes,
// split the json in data.json into smaller chunks of valid json
const MAX_CHUNK_SIZE = 3000; // bytes

import * as Data from "./data.json"

const fields = [
  ['Actions', 'comments'],
  ['Actions', 'posts'],
  ['Actions', 'messages'],
  ['Actions', 'reactions'],
  ['Profile', 'recentConnections'],
  ['Profile', 'recentFollowers']
];

function measure(chunk: any) {
  return new Blob([JSON.stringify(chunk)]).size;
}

/**
 * I left everything the same as we left off, less some unused lines of code and explicit `any`'s that turned out to not be needed.
 */
function splitData(data: typeof Data) {
  let anyDataLeft = true;
  const chunks: any[] = [];

  while (anyDataLeft) {
    const chunk =  {
      "Actions": {
        "comments": [],
        "posts": [],
        "messages": [],
        "reactions": [],
        "lastFetchTimestamp": data.Actions.lastFetchTimestamp
      },
      "Profile": {
        "recentConnections": [],
        "recentFollowers": [],
      },
      "retry_count": 0,
      guuid: data.guuid
    };

    let fieldIndex = 0;
    let dataInChunk = false;
    let maxSizeReached = false;

    while (!maxSizeReached && anyDataLeft) {
      let dataInFieldLoop = false;
      const fieldChunk = data[fields[fieldIndex][0]][fields[fieldIndex][1]].shift();

      if (fieldChunk !== undefined) {
        dataInChunk = true;
        dataInFieldLoop = true;
        chunk[fields[fieldIndex][0]][fields[fieldIndex][1]].push(fieldChunk);

        if (measure(chunk) > MAX_CHUNK_SIZE) {
          chunk[fields[fieldIndex][0]][fields[fieldIndex][1]].pop()
          maxSizeReached = true;
        }
      }

      if (++fieldIndex >= fields.length) {
        fieldIndex = 0;

        if (!dataInChunk || !dataInFieldLoop) {
          anyDataLeft = false;
        }
      }
    }

    if (dataInChunk) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

const chunks = splitData(Data);
chunks.forEach(chunk => console.log(JSON.stringify(chunk, null, 2)))

/**
 * How I would implement this for a large data set (initial thoughts):
 * 
 * Process the input in two phases. The first phase happens in a single process, the second is divided among N workers
 * 
 * First phase: break up large the data source into chunks, with a similar but simpler approach to the above, as the exact
 * size of the chunks does not matter, we just want N roughly equal sized chunks. This would be much less expensive as
 * we can skip the serialization and measurement, and save that for the smaller workers. Stringify the chunks, and send to the
 * workers.
 * 
 * Second phase: needs to happen in different processes or worker threads to see much benefit as JS is always single threaded.
 * In a serverless env these could just be lambdas, in a service these would be worker threads. A service would be more efficient
 * as you could use a SharedArrayBuffer to avoid copying memory from the main thread to the worker. Each worker would
 * then basically do the above (there are definitely some optimizations you can do to that code, although seruialize-and-check
 * may still be a good approach as JSON.stringify is native and will probably be faster than any clever JS heuristic you could
 * come up with). You could probably cut down on the number of calls to JSON.stringify using what would effectively look like
 * a binary search on the number of items you can fit within the designated maximum size. But given larger objects take longer
 * to serialize... it would take a benchmark to know for sure if it would actually be faster. There's probably a better search
 * analog for this than a binary search too, I'd have to do some reading to refresh my memory.
 * 
 * Other thoughts... if working with minified JSON, you could actually measure the size of components independently to avoid
 * repeated measurements. Might take some empirical data to find the optimal sub-structures to measure. If you wanted to get
 * really fancy, you could build a system that tracks the typical size of substructures and self-optimizes over time, building
 * heuristics based on real world data. But you'd have to be working with A LOT of data with VERY HIGH throughput to be worth the complexity.
 * 
 * If I have the energy I may give a simple parallel version a go this weekend, but we'll see.
 * 
 * Either way, thank you for your consideration, and have a nice weekend.
 */