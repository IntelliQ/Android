package com.intelliq.appengine.api.endpoint.business;

import com.intelliq.appengine.api.ApiRequest;
import com.intelliq.appengine.api.ApiResponse;
import com.intelliq.appengine.api.PermissionSet;
import com.intelliq.appengine.api.endpoint.Endpoint;
import com.intelliq.appengine.api.endpoint.EndpointManager;
import com.intelliq.appengine.datastore.BusinessHelper;
import com.intelliq.appengine.datastore.entries.BusinessEntry;
import com.intelliq.appengine.datastore.entries.PermissionEntry;
import com.intelliq.appengine.datastore.entries.UserEntry;
import com.intelliq.appengine.logging.BusinessLogging;

import java.util.ArrayList;
import java.util.List;

import javax.jdo.JDOObjectNotFoundException;
import javax.servlet.http.HttpServletResponse;


public class EditBusinessEndpoint extends Endpoint {

    public static final long MAXIMUM_BUSINESS_CREATIONS = 10;

    @Override
    public String getEndpointPath() {
        return EndpointManager.ENDPOINT_BUSINESS_EDIT;
    }

    @Override
    public List<String> getRequiredParameters(ApiRequest request) {
        List<String> parameters = new ArrayList<String>();
        parameters.add("businessKeyId");
        parameters.add("name");
        parameters.add("mail");
        return parameters;
    }

    @Override
    public boolean requiresAuthorization(ApiRequest request) {
        return true;
    }

    @Override
    public PermissionSet getRequiredPermissions(ApiRequest request) {
        PermissionSet permissionSet = new PermissionSet();

        PermissionEntry permissionEntry = new PermissionEntry();
        permissionEntry.setPermission(PermissionEntry.PERMISSION_EDIT);
        permissionEntry.setSubjectKeyId(request.getParameterAsLong("businessKeyId", -1));
        permissionSet.getPermissions().add(permissionEntry);

        return permissionSet;
    }

    @Override
    public ApiResponse generateRequestResponse(ApiRequest request) throws Exception {
        ApiResponse response = new ApiResponse();
        long businessKeyId = request.getParameterAsLong("businessKeyId", -1);

        try {
            UserEntry user = request.getUser();
            BusinessEntry businessEntry = BusinessHelper.getEntryByKeyId(businessKeyId);
            businessEntry.parseFromRequest(request);
            BusinessHelper.saveEntry(businessEntry);

            //TODO: add action

            response.setContent(businessEntry);
            BusinessLogging.logEdit(businessEntry, user);
        } catch (JDOObjectNotFoundException exception) {
            response.setStatusCode(HttpServletResponse.SC_NOT_FOUND);
            response.setException(new Exception("Unable to find requested business"));
        }
        return response;
    }

}
