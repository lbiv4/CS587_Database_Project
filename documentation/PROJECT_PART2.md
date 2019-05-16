# Project - Part 2

## Part 2 Overview

The goal of this part of the project is to establish some performance tests for our system. In my case, I will continue to be using Postgres as my DBMS and therefore will use the second option for this part of the project. The reason for this two-fold. First, it is a continuation of some aspects that led me to work with Postgres (namely comfortability with the system). Secondly, given that I am more inclined to using Postgres, I was interested in doing Option 2 to do a deeper dive into exactly how Postgres function. Relative comparisons of different database systems is obviously valuable and interesting if you are trying to identify pros and cons between them; but I already know that I like Postgres and therefore want to imporve my understanding of that system. Option 2 will allow me to do this by exploring different parameters that Postgres' query planner and memory management features utilize and then subsequently see how certain queries perform with different settings

## System Research

Since this project is focused on different Postgres parameters, it's worth establishing some information about what parameters might be relevant. Here is an overview of a few different parameters that can have an impact on query performance. This section discusses a different type of parameters we can vary - types of join algorithms, types of scanning algorithms, amount of working memory, page size, and execution parameters for the vacuum. Additionally, there is a brief discussion of the impact of indices and aggregate performance in Postgres

### Query Planner Algorithms

As with all database management systems, Postgres utilizes a query plan that decides the optimal algorithms to execute. However, the query planner can be manually manipulated by enabling or disabling different algorithms as desired. This is incredibly useful for testing different kinds of join algorithm or scanning methods to see how they perform. Starting with join algorithms, there are roughly five key functions:
* `enable_hashjoin` - This enables/disables hash joins plans
* `enable_mergejoin` - This enables/disables sort merge joins plans. It should be noted that this always sorts prior to merging. [citation](https://www.postgresql.org/docs/9.5/planner-optimizer.html). There is also an ability to explicitly turn off sorting (`enable_sort`) which may impact this plan type, although `enable_sort` is not guaranteed to stop all sorting so the impact may not be as large as expected
* `enable_nestloop` - This enables/disables nested loop joins.

Implicitly there is also sequential loops for scanning as a last resort option, essentially providing 4 different type of join plans. The query planner also has similar functions to control the execution of scanning algorithms:
* `enable_bitmapscan` - Enables/disables bitmap heap scan, which is essentially the heap scan for Postgres.
* `enable_indexscan` -  Enables/disables index scan
* `enable_seqscan` - Enables/disables sequential scan

It's worth pointing out that there are also two function for two different types of plans, TID scan and index-only scan plans. However, these are unlikely to be relevant for these benchmark queries. TID scan focuses on the inclusion of a very specific selection, `ctid = expression` [citation](http://etutorials.org/SQL/Postgresql/Part+I+General+PostgreSQL+Use/Chapter+4.+Performance/Understanding+How+PostgreSQL+Executes+a+Query/) while index-only scan is not likely to be used since queries search for the entire tuple as opposed to just the index.

### Additional Parameters

Aside from focusing on the query planner, there are some other interesting options for experimentation. First, the `work_mem` parameter dictates how much memory can be used by sorting and heap algorithms [citation](https://www.postgresql.org/docs/9.4/runtime-config-resource.html). Shrinking or expanding this can make heap and merge sort more or less desirable in conjunction with relations that are large and may not easily fit into memory. Another interesting option is the ability to enable `huge_pages`. This is a Linux specific option that can provide a certain number of pages of an extremely large size like 2 MB or 1 GB and some previous research has noted performance gains [citation](https://www.percona.com/blog/2018/12/20/benchmark-postgresql-with-linux-hugepages/). However, this special parameter requires certain configurations of process files in the Linux system, and given that I am utilizing a remote DB it is unclear whether the DB setup I am using would allow this as an option to be tested.

Finally, the last set of parameters to be mentioned are in relation to the vacuum cleaner, which serves to free up memory for active processes. The cleaner has multiple different functions that can be invoked to alter different aspects of the cleaner, but the four that are most relevant to this simple exploration of Postgres parameters are as follows:
* `vacuum_cost_limit` - This sets the "cost" or point at which the vacuum cleaner will begin to invoke to prevent buildup of deleted or unused tuples. This results in the vacuum causing the active process to sleep (and therefore impacts performance)
* `vacuum_cost_delay` - This dictates how long the process is told to sleep when the vacuum cost limit has been reached to allow vacuuming to occur. It is noted in the documentation that the default value is 0 and it is recommended to set this value to 10 or 20 milliseconds at most [citation](https://www.postgresql.org/docs/9.4/runtime-config-resource.html), indicating that this would likely show significant performance delays if active processes were stopping frequently for vacuuming.
*  `vacuum_cost_page_hit` - This is a metric to determine what "cost" should be added for vacuuming a shared buffer.
*  `vacuum_cost_page_miss` - Similar to the above, but instead associates a cost with having to go to disk and read in a new page to the buffer and vacuuming the old page.

Using these functions, it would be easy to affect the execution of the vacuum and see if it has an impact on performance. Specifically, by punishing queries that require a lot of vacuumming, you could identify which query plans are inefficient with their memory resources. However, after continued research I determined that it would be very difficult to design a viable experiment around the Postgres vacuum. While Postgres runs

### Aggregates and Indices in Postgres

Given that huge pages and vacuum parameters were not viable options, I spent some time on more general database functionality specific to Postgres. The first is 



## Performance Experiment Design

With some key research established, here are the ways in which this project will intend to analyze Postgres performance. The following sections contain four different experiments focusing on join algorithms, scanning algorithms, aggregates, and indices that use different Postgres parameters to determine the impact of each. 

### Experiment 1 - Join Algorithm Preferences

#### Overview

The first experiment that I am interested in is the priority and performance of different join algorithms. By viewing the query planner, it can be determined the "optimal" join algorithm to use for a certain query. However, what happens if you restrict the usage of the "optimal" join algorithm? What is the next best algorithm (according to the query planner) and what is the peformance difference? These question can be answered by repeated trials of the same queries with alterations to query planner options like `enable_hashjoin`, `enable_mergejoin`, etc. In other words, by varying the availability of different join method using an elimination process, we can see which join algorithms are prioritized and what their relative performance turns out to be.

#### Procedure/Queries

There are two queries from the Wisconsin Benchmark paper I plan on using:

```
Query 9 (no index) and Query 12 (clustered index) - JoinAselB
INSERT INTO TMP
SELECT * FROM TENKTUP1, TENKTUP2
WHERE (TENKTUP1.unique2 = TENKTUP2.unique2)  
AND (TENKTUP2.unique2 < 1000)
```
The procedure for each query individually would be as follows:
1. Repeat the following three times:
    * Execute the query with the query planner displayed (i.e. `EXPLAIN ANALYZE <query>`)
    * Identify the join algorithm used and the overall execution time of the query
2. For the three trials last executed in Step 1, identify the algorithm that appears the most (if three distinct join algorithms are chosen, either repeat Step 1 until a majority appears OR take the algorithm with the best performance) and take the average execution time of all trials that used that algorithm.
3. Find the matching query planner boolean (i.e. `enable_hashjoin` if a hash join was identified) and set the value to false to ensure that this algorithm is not reused.
4. Repeat Steps 1-3 until all join algorithms aside from cross-join have been disabled in the query planner.

#### Succinct Q&A Summary

* **What performance issue you testing?** Comparison of different join algorithms, measured by average execution time of benchmark queries

* **What data sets will you include in the test?** This test will focus on a join of two different tables with 10,000 tuples. This is a noted limitation of the experiment design, as joins of different-sized tables might prioritize different join algorithms first. However, a relative priority/performance for this query instance can be established and is worth exploring.

* **What queries will you run?** Queries 9 and 12 from the Wisconsin Benchmark, as noted in the above section

* **What parameters will you use for this test?** The varied parameters for this experiment are the availability of different join algorithms, which are disabled one at a time via various `enable` commands.

* **What results do you expect to get?** For this specific query instance with two similarly sized tables, I would expect hash join to be used first, followed by merge join, and then nested loop join. In terms of performance, I would expect hash and merge join to be relatively similar, with a slight drop off for nested loop join.


### Experiment 2 - Scan Algorithm Preferences

#### Overview

The second experiment is a similar version to the first that instead focuses on scanning functionality in selection queries. In this experiment, we will repeatedly judge which scanning process is preferred, mark its perfomance over a few trials, then disabled it with the corresponding `enable` command to allow another scanning method to be used.

#### Procedure/Queries

There are two queries from the Wisconsin Benchmark paper I plan on using:

```
Query 2 (no index) & Query 4 (clustered index) - 10% selection
INSERT INTO TMP
SELECT * FROM TENKTUP1
WHERE unique2 BETWEEN 792 AND 1791
```
The procedure for each query individually would be as follows:
1. Repeat the following three times:
    * Execute the query with the query planner displayed (i.e. `EXPLAIN ANALYZE <query>`)
    * Identify the scanning process used and the overall execution time of the query
2. For the three trials last executed in Step 1, identify the scan that appears the most (if three distinct scan algorithms are chosen, either repeat Step 1 until a majority appears OR take the algorithm with the best performance) and take the average execution time of all trials that used that type of scan.
3. Find the matching query planner boolean (i.e. `enable_indexscan` if a index scan was identified) and set the value to false to ensure that this algorithm is not reused.
4. Repeat Steps 1-3 until all scan types aside from sequential scan have been disabled in the query planner.

#### Succinct Q&A Summary

* **What performance issue you testing?** Comparison of different scan algorithms, measured by average execution time of benchmark queries

* **What data sets will you include in the test?** 

* **What queries will you run?** Queries 2 and 4 from the Wisconsin Benchmark, as noted in the above section

* **What parameters will you use for this test?** The varied parameters for this experiment are the availability of different scan algorithms, which are disabled one at a time via various `enable` commands.

* **What results do you expect to get?** 



### Experiment 3 - Aggregation and Working Memory

#### Overview

The next experiment is one that I was actually inspired to do by database comparisons. In older versions of Postgres, aggregate functions were noted to be quite slow due to Postgres' use if multi-version concurrency and the way it scans the table for aggregation [citation](https://wiki.postgresql.org/wiki/Introduction_to_VACUUM,_ANALYZE,_EXPLAIN,_and_COUNT). While this citation is old and 

#### Procedure/Queries

There are two queries from the Wisconsin Benchmark paper I plan on using:

```
Query 2 (no index) & Query 4 (clustered index) - 10% selection
INSERT INTO TMP
SELECT * FROM TENKTUP1
WHERE unique2 BETWEEN 792 AND 1791
```
The procedure for each query individually would be as follows:
1. Repeat the following three times:
    * Execute the query with the query planner displayed (i.e. `EXPLAIN ANALYZE <query>`)
    * Identify the scanning process used and the overall execution time of the query
2. For the three trials last executed in Step 1, identify the scan that appears the most (if three distinct scan algorithms are chosen, either repeat Step 1 until a majority appears OR take the algorithm with the best performance) and take the average execution time of all trials that used that type of scan.
3. Find the matching query planner boolean (i.e. `enable_indexscan` if a index scan was identified) and set the value to false to ensure that this algorithm is not reused.
4. Repeat Steps 1-3 until all scan types aside from sequential scan have been disabled in the query planner.

#### Succinct Q&A Summary

* **What performance issue you testing?** Comparison of different scan algorithms, measured by average execution time of benchmark queries

* **What data sets will you include in the test?** 

* **What queries will you run?** Queries 2 and 4 from the Wisconsin Benchmark, as noted in the above section

* **What parameters will you use for this test?** The varied parameters for this experiment are the availability of different scan algorithms, which are disabled one at a time via various `enable` commands.

* **What results do you expect to get?** 

### Experiment 4 - Vacuum Cleaner Impact

## Lessons Learned

-Repeating same query gets more efficient (vary selectivity)
