# Project - Part 2

## Part 2 Overview

The goal of this part of the project is to establish some performance tests for our system. In my case, I will continue to be using Postgres as my DBMS and therefore will use the second option for this part of the project. The reason for this two-fold. First, it is a continuation of some aspects that led me to work with Postgres (namely comfortability with the system). Secondly, given that I am more inclined to using Postgres, I was interested in doing Option 2 to do a deeper dive into exactly how Postgres function. Relative comparisons of different database systems is obviously valuable and interesting if you are trying to identify pros and cons between them; but I already know that I like Postgres and therefore want to imporve my understanding of that system. Option 2 will allow me to do this by exploring different parameters that Postgres' query planner and memory management features utilize and then subsequently see how certain queries perform with different settings

## System Research

Since this project is focused on different Postgres parameters, it's worth establishing some information about what parameters might be relevant. Here is an overview of a few different parameters that can have an impact on query performance. This section discusses a different type of parameters we can vary - types of join algorithms, types of scanning algorithms, amount of working memory, page size, and execution parameters for the vacuum. Additionally, there is a brief discussion of the impact of indices and aggregate performance in Postgres

### Query Planner Algorithms

As with all database management systems, Postgres utilizes a query plan that decides the optimal algorithms to execute. However, the query planner can be manually manipulated by enabling or disabling different algorithms as desired. This is incredibly useful for testing different kinds of join algorithm or scanning methods to see how they perform. Starting with join algorithms, there are roughly five key functions identified in the Postgres documentation ("Query Planning"):
* `enable_hashjoin` - This enables/disables hash joins plans
* `enable_mergejoin` - This enables/disables sort merge joins plans. It should be noted that this always sorts prior to merging (["Planner/Optimizer"](#works-cited)). There is also an ability to explicitly turn off sorting (`enable_sort`) which may impact this plan type, although `enable_sort` is not guaranteed to stop all sorting so the impact may not be as large as expected
* `enable_nestloop` - This enables/disables nested loop joins.

Implicitly there is also sequential loops for scanning as a last resort option, essentially providing 4 different type of join plans. The query planner also has similar functions to control the execution of scanning algorithms (["Query Planning"](#works-cited)):
* `enable_bitmapscan` - Enables/disables bitmap heap scan, which is essentially the heap scan for Postgres.
* `enable_indexscan` -  Enables/disables index scan
* `enable_indexonlyscan` - Enables/disabls index-only scan.
* `enable_seqscan` - Enables/disables sequential scan

It's worth pointing out that there are also a function for TID scan . However, these are unlikely to be relevant for these benchmark queries as TID scan focuses on the inclusion of a very specific selection, `ctid = expression` (["Understanding How PostgreSQL Executes a Query"](#works-cited))

### Additional Parameters

Aside from focusing on the query planner, there are some other interesting options for experimentation. First, the `work_mem` parameter dictates how much memory can be used by sorting and heap algorithms (["Resource Consumption"](#works-cited)). Shrinking or expanding this can make heap and merge sort more or less desirable in conjunction with relations that are large and may not easily fit into memory. Another interesting option is the ability to enable `huge_pages`. This is a Linux specific option that can provide a certain number of pages of an extremely large size like 2 MB or 1 GB and some previous research has noted performance gains ([Ahmed](#works-cited)). However, this special parameter requires certain configurations of process files in the Linux system, and given that I am utilizing a remote DB it is unclear whether the DB setup I am using would allow this as an option to be tested.

Finally, the last set of parameters to be mentioned are in relation to the vacuum cleaner, which serves to free up memory for active processes. The cleaner has multiple different functions that can be invoked to alter different aspects of the cleaner, but the four that are most relevant to this simple exploration of Postgres parameters are as follows (["Resource Consumption"](#works-cited)):
* `vacuum_cost_limit` - This sets the "cost" or point at which the vacuum cleaner will begin to invoke to prevent buildup of deleted or unused tuples. This results in the vacuum causing the active process to sleep (and therefore impacts performance)
* `vacuum_cost_delay` - This dictates how long the process is told to sleep when the vacuum cost limit has been reached to allow vacuuming to occur. It is noted in the documentation that the default value is 0 and it is recommended to set this value to 10 or 20 milliseconds at most (["Resource Consumption"](#works-cited)), indicating that this would likely show significant performance delays if active processes were stopping frequently for vacuuming.
*  `vacuum_cost_page_hit` - This is a metric to determine what "cost" should be added for vacuuming a shared buffer.
*  `vacuum_cost_page_miss` - Similar to the above, but instead associates a cost with having to go to disk and read in a new page to the buffer and vacuuming the old page.

Using these functions, it would be easy to affect the execution of the vacuum and see if it has an impact on performance. Specifically, by punishing queries that require a lot of vacuumming, you could identify which query plans are inefficient with their memory resources. However, after continued research I determined that it would be very difficult to design a viable experiment around the Postgres vacuum. While Postgres runs

### Indexes and Aggregates in Postgres

Given that huge pages and vacuum parameters were not viable options, I spent some time on more general database functionality specific to Postgres. The first aspect of databases of interest to me is indexes and the impact of increase number of them on database performance. It's noted that an increased number of indexes reduces the runtime of insert function due to the need to update more indexes in the background with the new tuples ([Kerstiens](#works-cited)). However, at this point in my research it is unclear whether this impact is linear, expontential, or some other increase with respect to the number of indexes. I hope to provide a better understanding of this with experimentation.

Another area of interest is in relation to aggregates. In older versions of Postgres, aggregate functions were noted to be quite slow due to Postgres' use if multi-version concurrency and the way it scans the table for aggregation ([Nasby](#works-cited)). While this citation is old and not guaranteed to apply to the current version of Postgres, more recent work has other avenues of exploration. Some sources identify the inclusion of index-only scans since Postgres 9.2 as a performance boost for `COUNT(*)` ([Kerstiens](#works-cited)), meaning that enabling or disabling the query planner implementation of this with `enable_indexonlyscan`. Another observations is that Postgres relies on either hashing or group aggregate features of the query planner which have different pros and cons; specifically, group aggregation requires sort (which takes longer) but hash aggregation requires more memory ([Bashtanov 26](#works-cited)). We can test performance with respect to these aggregation features either through alterating query plan options via `enable_hashagg` or `enable_sort` or by adjusting `work_mem`. 


## Performance Experiment Design

With some key research established, here are the ways in which this project will intend to analyze Postgres performance. The following sections contain four different experiments focusing on join algorithms, scanning algorithms, aggregates, and indices that use different Postgres parameters to determine the impact of each. 

### Experiment 1 - Join Algorithm Preferences

#### Overview

The first experiment that I am interested in is the priority and performance of different join algorithms. By viewing the query planner, it can be determined the "optimal" join algorithm to use for a certain query. However, what happens if you restrict the usage of the "optimal" join algorithm? What is the next best algorithm (according to the query planner) and what is the peformance difference? These question can be answered by repeated trials of the same queries with alterations to query planner options like `enable_hashjoin`, `enable_mergejoin`, etc. In other words, by varying the availability of different join method using an elimination process, we can see which join algorithms are prioritized and what their relative performance turns out to be.

#### Procedure/Queries

There are two queries from the Wisconsin Benchmark paper I plan on using ([DeWitt 41](#works-cited)):

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

* **What performance issue you testing?** Comparison of different join algorithms, measured by average execution time of benchmark queries. The relvative order of algorithms preference is also of interest.

* **What data sets will you include in the test?** This test will focus on a join of two different tables with 10,000 tuples. This is a noted limitation of the experiment design, as joins of different-sized tables might prioritize different join algorithms first; however, a relative priority/performance for this specific instance can be established and is worth exploring. If I had more time I could consider expanding this to a join on tables of different sizes, but at this point in time that is not my plan.t

* **What queries will you run?** Queries 9 and 12 from the Wisconsin Benchmark, as noted in the above section

* **What parameters will you use for this test?** The varied parameters for this experiment are the availability of different join algorithms, which are disabled one at a time via various `enable` commands.

* **What results do you expect to get?** For this specific query instance with two similarly sized tables, I would expect hash join to be used first, followed by merge join, and then nested loop join. In terms of performance, I would expect hash and merge join to be relatively similar, with a slight drop off for nested loop join.  


### Experiment 2 - Scan Algorithm Preferences

#### Overview

The second experiment is a similar version to the first that instead focuses on scanning functionality in selection queries. In this experiment, we will repeatedly judge which scanning process is preferred, mark its perfomance over a few trials, then disabled it with the corresponding `enable` command to allow another scanning method to be used.

#### Procedure/Queries

There are two queries from the Wisconsin Benchmark paper I plan on using, Query 2 and 4 ([DeWitt 40](#works-cited)), with a slight modification to account for an expansion to a large 1 million tuple relation:

```
INSERT INTO TMP
SELECT * FROM ONEMILTUP1
WHERE unique2 BETWEEN 1001 AND 110010
```
The procedure for each query individually would be as follows:
1. Repeat the following three times:
    * Execute the query with the query planner displayed (i.e. `EXPLAIN ANALYZE <query>`)
    * Identify the scanning process used and the overall execution time of the query
2. For the three trials last executed in Step 1, identify the scan that appears the most (if three distinct scan algorithms are chosen, either repeat Step 1 until a majority appears OR take the algorithm with the best performance) and take the average execution time of all trials that used that type of scan.
3. Find the matching query planner boolean (i.e. `enable_indexscan` if a index scan was identified) and set the value to false to ensure that this algorithm is not reused.
4. Repeat Steps 1-3 until all scan types aside from sequential scan have been disabled in the query planner.

#### Succinct Q&A Summary

* **What performance issue you testing?** Comparison of different scan algorithms, measured by average execution time of benchmark queries with observational data taken on the order in which the scanning algorithms are prioritized

* **What data sets will you include in the test?** In this case I intend to use one large 1 million tuple relation to allow for a longer time to complete the selection and thus have better distinctions between execution times (due to longer overall time to complete).

* **What queries will you run?** Queries 2 and 4 from the Wisconsin Benchmark with a small modifcation to the selection predicate to account for the larger relation, as noted in the above section

* **What parameters will you use for this test?** The varied parameters for this experiment are the availability of different scan algorithms, which are disabled one at a time via various `enable` commands.

* **What results do you expect to get?** This will likely differ between the two different queries. In Query 4, index scan will be the fastest and first used due to the index on `unique2` (especially with the `WHERE` clause also referencing that). In Query 2 index scan will likely be omitted due to the lack of an index in that design. The next option (after index scan in Query 4 but as the first option in Query 2) will be bitmap heap scan and finally sequential scan as the last resort. It's also worth noting that index-only scan will not be used since the query is `SELECT *`, so we will only need to account for three different types of scans.


### Experiment 3 - Aggregation and Working Memory

#### Overview

The next experiment is one that I was actually inspired to do by database comparisons. As noted in the [System Research](#system-research) section, Postgres has previously had issues with aggregation prior to the introduction of index-only scan. In this experiment, I want to push the boundaries of what makes aggregates tick by varying two different sets of parameters. First is the ability to use index-only scans to see what kind of improvement this more modern implementation of Postgres provides. Secondly, I want to see how varying the amount of working memory will affect the aggregate, as presumably this will make hash aggregation more or less efficient depending on how much working memory is available. By varying both these parameters, we can assess how efficient Postgres is when doing aggregates

#### Procedure/Queries

There are two queries from the Wisconsin Benchmark paper I plan on using, Query 20 and 23 ([DeWitt 42](#works-cited)), with a slight modification to account for an expansion to a large 1 million tuple relation:

```
Query 20 (no index) and Query 23 (with clustered index) - Minimum Aggregate Function
INSERT INTO TMP
SELECT MIN (ONEMILTUP1.unique2) 
FROM ONEMILTUP1
```

It is also possible that I might try `COUNT(*)` as well if time permits. The procedure for each query individually would be as follows:
1. Decide whether to enable or disable the ability to use index-only scan with `enable_indexonlyscan`.
2. Set the amount of working memory to either 1 MB, 4 MB (the default), or 16 MB
3. Execute the query with `EXPLAIN ANALYZE <query>` to get the runtime execution of query and identify how the query planner ran the query (with hash aggregation, group aggregation, etc.)
4. Repeat Steps 1-3 three times with the same parameters chosen in Steps 1 and 2, then take the average runtime.
5. Repeat Steps 1-4 with all distinct combinations of parameters chosen in Steps 1 and 2.

#### Succinct Q&A Summary

* **What performance issue you testing?** Comparison of aggregate query execution with/without index-only scan available and with different amounts of working memory

* **What data sets will you include in the test?** A single 1 million tuple relation which will allow for longer execution times and thus better variability

* **What queries will you run?** Queries 20 and 23 from the Wisconsin Benchmark, with a small modifcation to the selection predicate to account for the larger relation, as noted in the above section. I may also run a similar query with `COUNT(*)` as a different kind of aggregate function.

* **What parameters will you use for this test?** There are two varied parameters. The first is the availabilty of index-only scan to the query planner (set on or off with `enable_indexonlyscan`) and the second is the amount of working memory available as dictated by `work_mem`.

* **What results do you expect to get?** There are really two distinct parameter variations in here which I will address seperately. First, disabling index-only scan should worsen performance for Query 23 (with the index) but have no impact on Query 20 (without the index). I imagine that this impact for Query 23 will likely be very significant, as the index-only scan simply needs to quickly find the smallest value while otherwise the best option is a sequential scan. The second parameter is working memory, which I believe should be consistent between Query 20/23 as working memory should only impact the execution of hash aggregation and is independant of an index-only scan. With this in mind, lower working memory should result in a slower execution time due to less resources available to hash all the tuples. That being said, there is likely a cutoff for this point - if the entire hash table can fit in working memory there is no issue, so the execution of some parameters may be identical and it is only those who do not have enough working memory that will see a decreasing performance

### Experiment 4 - Impact of Increased Indexes on Insertions

#### Overview

The final experiment is one of personal curiosity. Database users are always told that increased numbers of indexes - but what is the rate of performance impact as a function of the number of extra indexes? For this experiment, I intend to introduce indexes on 0-4 different attributes (likely `unique1`, `unique2`, `stringu1`, and `stringu2`) one at a time and run insertions into the table to determine what the cost of insertion is for that distinct table design. Finally, to add a little more intrigue, I will also vary the size of the relation into which a single tuple is inserted to judge how effective the index insertion would be as the size of the indexes increase

#### Procedure/Queries

There are two queries from the Wisconsin Benchmark paper I plan on using, Query 26 and 29 ([DeWitt 43](#works-cited)), with a slight modification to account for the need to insert a random tuple and the possibility of having different sized relations:

```
Query 26 (no indices) and Query 29 (with indices) - Insert 1 tuple
INSERT INTO <varied relation> VALUES(<TO BE VARIED>)
```

The procedure for each query would be as follows:
1. Introduce 0-4 indexes into the a relation of size N.
2. Generate a dataset of N+1 tuples and load N into the relation. Identify the last, not inserted row.
3. Execute the query with the values contained in the final uninsert row, using `ANALYZE` to get the runtime. This guarantees a random value for each index which is better for testing purposes.
4. Repeat Steps 1-3 three times and take the average execution time. This will likely require dropping the `TENKTUP1` table or more likely deleting the final inserted row for consistency
5. Repeat Steps 1-4 with different N values, namely 10k, 100k, and 1mil.

#### Succinct Q&A Summary

* **What performance issue you testing?** Comparison of insertion time relative to number of indexes and number of tuples in the relation

* **What data sets will you include in the test?** Relations of sizes ranging from 10k, 100k, and 1mil tuples and also different number of indices. This will require different data generation, specifically randomly generating N+1 tuples for a size N relation so that the N+1st row to be inserted is random with respect to the different indexes

* **What queries will you run?** Queries 26 and 29 from the Wisconsin Benchmark, with adjustments to the relation used and the exact tuple values depending on the specific parameters for the experiment and the random generation

* **What parameters will you use for this test?** There are two varied parameters. The first is the number of indexes on the relation (focused on any number of `unique1`, `unique2`, `stringu1`, and `stringu2`) and the second is the size of the relation into which a tuple will be inserted

* **What results do you expect to get?** With regards to the impact of number of indexes, it's likely that more indexes will see an increase in exection time because the index B-trees will have to be updated with the insertion and more work will need to be done with more indexes. I think the execution time may be linear, but in a very, very small amount that may not be distinguisable depending on the initial insertion time. As for scaling up the size of the relation prior to insertion, more tuples means more work for updating the B-trees as well. However, I don't expect a major difference because a major benefit of the B-tree design is that it is not very deep, meaning that a traversal for an insertion wont actually take that long even if a lot more tuples are in the tree.

## Lessons Learned

While I definitely learned a ton during the research phase of this second part of the project, there were a few practical takeaways that I will definitely have to consider moving into the final part. First, in experimenting with some of my query planner experiments, it was very obvious that repeated execution of the same query sees a major performance improvement, with the planning and execution time dropping by anywhere from 30-50%. This is likely because the query has data already loaded into the buffer cache/has some historical data on the past execution to speed up the subsequent query. While this is an excellent feature of a database, it is annoying when I am trying to have repeated, consistent trials to get more accurate data. The best solution I could find is simply restarting my connection and re-running the query, but also varying the exact search parameters (i.e. the selection of the `WHERE` clause) could also help. It's also possible that I just measure "hot" queries for each variation, as this provides consistency at the expense of a more realistic scenario where a query is run cold.

This issue of consistent data is also relevant in a few other areas. For example, in Experiment 4 I have the unique approach of actually altering tables to introduce new indexes. This will likely require dropping and recreating completely new tables each time, which raises questions of consistency as the design of the indexes' B-trees may very well be different from trial to trial (let alone with different number of indexes). The different index is also relevant because a given insertion may be easier or hard for certain B-tree implementations than for others, meaning that even if I correctly insert a "random" tuple into the relation, that tuple may be easier or more difficult to index depending on a desing that is out of my control. I will likely have to watch the deviation for trials and determine if more are necesary for increased consistency.

Finally, I wanted to emphasize that I was REALLY interested in experimenting with the impact of the Postgres vacuum cleaner on execution time, as I believe that it is a unique aspect of this specific DBMS and have had real world experiences with potential issues it can cause. The problem I encountered was that the vacuum is usually run automatically and I couldn't find consistent enough documentation to identify whether it would run automatically during a memory/tuple intensive query. Even if I could establish that as fact, I was also unclear whether the vacuum would directly impact a query's execution time or just run on a separate thread that doesn't provide a measurable performance difference. Due to this factors, I did not end up running an experiment with regards to this feature that I researched extensively.

## Works Cited

Ahmed, Ibrar. "Benchmark PostgreSQL With Linux HugePages." Percona.com, Percona, www.percona.com/blog/2018/12/20/benchmark-postgresql-with-linux-hugepages/.

Bashtanov, Alexey. "PostgreSQL, performance for queries with grouping." SlideShare, www.slideshare.net/AlexeyBashtanov/postgresql-performance-for-queries-with-grouping. Accessed 14 May 2019.

DeWitt, David J. "The Wisconsin Benchmark: Past, Present, and Future." *Computer Science Department, University of Wisconsin*, p. 1-43.

Kerstiens, Craig. "Indexes." Postgres Guide, posrgresguide.com, postgresguide.com/performance/indexes.html. Accessed 15 May 2019.

Nasby, Jim. "Introduction to VACUUM, ANALYZE, EXPLAIN, and COUNT." wiki.postgres.org, 2005, wiki.postgresql.org/wiki/Introduction_to_VACUUM,_ANALYZE,_EXPLAIN,_and_COUNT.

"Planner/Optimizer." PostgreSQL.org, The PostgreSQL Global Development Group, www.postgresql.org/docs/9.5/planner-optimizer.html.

"Query Planning." PostgreSQL.org, The PostgreSQL Global Development Group, www.postgresql.org/docs/9.4/runtime-config-query.html.

"Resource Consumption." PostgreSQL.org, The PostgreSQL Global Development Group, www.postgresql.org/docs/9.4/runtime-config-resource.html.

"Understanding How PostgreSQL Executes a Query." eTutorials, etutorials.org/SQL/Postgresql/Part+I+General+PostgreSQL+Use/Chapter+4.+Performance/Understanding+How+PostgreSQL+Executes+a+Query/.
