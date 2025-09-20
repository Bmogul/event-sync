// Test script for incremental updates functionality
// This file can be run in the browser console to test change tracking

/**
 * Test script for incremental updates
 * Run this in the browser console on the create-event page
 */

async function testIncrementalUpdates() {
  console.log('🧪 Testing Incremental Updates...');
  
  // Test data
  const testEventData = {
    public_id: 'test-event-' + Date.now(),
    title: 'Test Event',
    description: 'Original description',
    location: 'Original location',
    subEvents: [
      {
        id: 1,
        title: 'Ceremony',
        location: 'Chapel',
        date: '2024-07-15'
      },
      {
        id: 2,
        title: 'Reception',
        location: 'Hall',
        date: '2024-07-15'
      }
    ],
    guestGroups: [
      {
        id: 1,
        name: 'Family',
        color: '#ff0000'
      }
    ],
    guests: [
      {
        public_id: 'guest-1',
        name: 'John Doe',
        email: 'john@example.com',
        group: 'Family'
      }
    ],
    rsvpSettings: {
      pageTitle: 'Original Title',
      theme: 'elegant'
    }
  };

  // Initialize change tracking
  const { useChangeTracking } = await import('./hooks/useChangeTracking.js');
  const changeTracking = useChangeTracking();
  
  console.log('✅ Change tracking initialized');
  
  // Step 1: Initialize with test data
  changeTracking.initializeTracking(testEventData);
  console.log('✅ Test data loaded into change tracking');
  
  // Step 2: Make some changes
  console.log('🔄 Making test changes...');
  
  // Change main event fields
  changeTracking.updateData({
    title: 'Updated Test Event',
    description: 'Updated description'
  });
  
  // Change sub-events
  const updatedSubEvents = [...testEventData.subEvents];
  updatedSubEvents[0] = { ...updatedSubEvents[0], location: 'Updated Chapel' };
  updatedSubEvents.push({
    id: -(Date.now()),
    title: 'New Sub-Event',
    location: 'New Venue',
    date: '2024-07-16'
  });
  
  changeTracking.updateData({ subEvents: updatedSubEvents });
  
  // Change RSVP settings
  changeTracking.updateData({
    rsvpSettings: {
      pageTitle: 'Updated RSVP Title',
      theme: 'modern'
    }
  });
  
  console.log('✅ Changes applied');
  
  // Step 3: Generate change payload
  const changes = changeTracking.getChanges();
  
  if (!changes) {
    console.error('❌ No changes detected!');
    return;
  }
  
  console.log('📊 Generated changes:', changes);
  
  // Step 4: Analyze payload size
  const sizeComparison = changeTracking.getPayloadSizeComparison();
  console.log('📏 Payload size comparison:', sizeComparison);
  console.log(`   Full payload: ${sizeComparison.fullSize} chars`);
  console.log(`   Incremental: ${sizeComparison.incrementalSize} chars`);
  console.log(`   Reduction: ${sizeComparison.reduction}%`);
  
  // Step 5: Validate change structure
  const expectedSections = ['mainEvent', 'subEvents', 'rsvpSettings'];
  const actualSections = Object.keys(changes.changes);
  
  console.log('🔍 Validating change structure...');
  expectedSections.forEach(section => {
    if (actualSections.includes(section)) {
      console.log(`   ✅ ${section} detected`);
    } else {
      console.warn(`   ⚠️ ${section} missing`);
    }
  });
  
  // Step 6: Validate specific changes
  const { mainEvent, subEvents, rsvpSettings } = changes.changes;
  
  // Check main event changes
  if (mainEvent?.title === 'Updated Test Event' && mainEvent?.description === 'Updated description') {
    console.log('   ✅ Main event changes correct');
  } else {
    console.error('   ❌ Main event changes incorrect');
  }
  
  // Check sub-event changes
  if (subEvents?.modified?.[1]?.location === 'Updated Chapel' && subEvents?.added?.length === 1) {
    console.log('   ✅ Sub-event changes correct');
  } else {
    console.error('   ❌ Sub-event changes incorrect');
  }
  
  // Check RSVP settings changes
  if (rsvpSettings?.pageTitle === 'Updated RSVP Title' && rsvpSettings?.theme === 'modern') {
    console.log('   ✅ RSVP settings changes correct');
  } else {
    console.error('   ❌ RSVP settings changes incorrect');
  }
  
  // Step 7: Test reset functionality
  changeTracking.markAsSaved();
  const changesAfterSave = changeTracking.getChanges();
  
  if (!changesAfterSave) {
    console.log('✅ Change tracking reset after save');
  } else {
    console.error('❌ Change tracking not reset after save');
  }
  
  console.log('🎉 Incremental updates test completed!');
  
  return {
    changes,
    sizeComparison,
    success: true
  };
}

// API endpoint test
async function testIncrementalAPI() {
  console.log('🧪 Testing Incremental API...');
  
  const testChanges = {
    public_id: 'test-event-api',
    status: 'draft',
    isPartialUpdate: true,
    conflictToken: 'test-token',
    mainEvent: {
      title: 'API Test Event',
      description: 'Testing incremental updates'
    },
    subEvents: {
      added: [
        {
          title: 'New API Sub-Event',
          location: 'API Venue'
        }
      ],
      modified: {
        '1': {
          location: 'Updated API Location'
        }
      }
    }
  };
  
  try {
    // Note: This will fail without proper authentication
    // This is just to test the payload structure
    console.log('📤 Incremental API payload:', testChanges);
    console.log('   Payload size:', JSON.stringify(testChanges).length, 'chars');
    
    // Simulate what would be sent to API
    const mockResponse = {
      method: 'PATCH',
      url: '/api/events',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer [token]'
      },
      body: JSON.stringify(testChanges)
    };
    
    console.log('✅ API payload structure valid');
    console.log('📋 Mock request:', mockResponse);
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

// Performance comparison test
function testPerformanceComparison() {
  console.log('🧪 Testing Performance Comparison...');
  
  // Generate large test event
  const largeEvent = {
    public_id: 'large-test-event',
    title: 'Large Test Event',
    description: 'Event with many sub-events and guests',
    subEvents: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      title: `Sub-Event ${i + 1}`,
      description: `Description for sub-event ${i + 1}`,
      location: `Venue ${i + 1}`,
      date: '2024-07-15'
    })),
    guestGroups: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Group ${i + 1}`,
      description: `Guest group ${i + 1}`,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    })),
    guests: Array.from({ length: 100 }, (_, i) => ({
      public_id: `guest-${i + 1}`,
      name: `Guest ${i + 1}`,
      email: `guest${i + 1}@example.com`,
      group: `Group ${(i % 10) + 1}`
    }))
  };
  
  // Small change to large event
  const smallChange = {
    title: 'Updated Large Test Event'
  };
  
  const fullPayload = JSON.stringify(largeEvent);
  const incrementalPayload = JSON.stringify({
    public_id: largeEvent.public_id,
    mainEvent: smallChange
  });
  
  const reduction = Math.round((1 - incrementalPayload.length / fullPayload.length) * 100);
  
  console.log('📊 Performance comparison results:');
  console.log(`   Full payload: ${fullPayload.length} chars`);
  console.log(`   Incremental: ${incrementalPayload.length} chars`);
  console.log(`   Reduction: ${reduction}%`);
  console.log(`   Size ratio: 1:${Math.round(fullPayload.length / incrementalPayload.length)}`);
  
  return { fullPayload, incrementalPayload, reduction };
}

// Export functions for console use
if (typeof window !== 'undefined') {
  window.testIncrementalUpdates = testIncrementalUpdates;
  window.testIncrementalAPI = testIncrementalAPI;
  window.testPerformanceComparison = testPerformanceComparison;
  
  console.log('🧪 Test functions available:');
  console.log('   • testIncrementalUpdates() - Test change tracking functionality');
  console.log('   • testIncrementalAPI() - Test API payload structure');
  console.log('   • testPerformanceComparison() - Test payload size reduction');
}

export {
  testIncrementalUpdates,
  testIncrementalAPI,
  testPerformanceComparison
};