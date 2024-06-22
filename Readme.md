# Youtube clone backend
This is backend practice making a youtube simiar clone with channel Chai aur code .

* whereever we use app.use it means it is a middleware . Middleware means whenever we want to check or make changes before our request goes into server for final responses.
Middleware refers to functions that sit between the raw request from the client and the final handling of that request by your server application. Specifically, in the context of Express.js, middleware functions are used to handle and process requests before they reach your application's route handlers. 

* jwt is a bearer token
* file uploading we use cloudinary

# What is Http:
HTTP (Hypertext Transfer Protocol) is the foundation for communication between the client and the server.
Client request the data and server send response based on client request.

# Http Methods
1. Get -> retrieve a resources
2. Post -> add resources
3. Delete -> remove resources
4. Put ->update a resource entirely. It replaces the current representation of the resource
        with the  one provided in the request body.
5. Patch =>partial updates to a resource. It updates only the specified fields. it is used to update
            certain resources

# Http status code 
- 1xx: Informational
- 2xx: Success
- 3xx: Redirection
- 4xx: Client Errors
- 5xx: Server Errors

Examples:-
    100-continue                   
    102-Processing                  
    200-ok
    201-created
    202-accepted
    307-temporary redirect
    308-permanent redirect
    400-Bad request
    401-unauthoriazed
    402-Payment required
    404-Not found
    500-internal server error
    504-Gateway timeout
