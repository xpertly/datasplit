// read in the data from data.json

// given a MAX json chunk size in bytes,
// split the json in data.json into smaller chunks of valid json
const MAX_CHUNK_SIZE = 10000; // bytes

// each chunk should contain the structure specified in "chunk_template":
const chunk_template =  {
  "Actions": {
    "comments": [],
    "posts": [],
    "messages": [],
    "reactions": [],
    "lastFetchTimestamp": 123456789
  },
  "Profile": {
    "recentConnections": [],
    "recentFollowers": [],
  },
  "retry_count": 0,
  "guuid": "ABCD1234"
};

// output the chunks to console.
