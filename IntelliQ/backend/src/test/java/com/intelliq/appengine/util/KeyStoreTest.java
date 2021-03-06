package com.intelliq.appengine.util;

import org.junit.Test;

import static org.junit.Assert.*;

/**
 * Created by Steppschuh on 07/03/2017.
 */
public class KeyStoreTest {

    /**
     * Caution: the keystore.properties file is not part of the version control
     * and thus not available on the CI server (where this test should fail).
     */
    //@Test
    public void getKey_existingKey_returnsValue() throws Exception {
        String testKey = "TEST_KEY";
        String expected = "TEST_VALUE";
        String actual = KeyStore.getKey(testKey);
        assertEquals("Key value not as expected", expected, actual);
    }

    @Test
    public void getKey_notExistingKey_returnsKey() throws Exception {
        String testKey = "NOT_EXISTING_KEY";
        String expected = testKey;
        String actual = KeyStore.getKey(testKey);
        assertEquals("Key value not as expected", expected, actual);
    }

}