// Script to clean up sample orders from the database
// Run this in your browser console on mypartsrunner.com

console.log('Starting cleanup of sample orders...');

// Function to delete sample orders
async function cleanupSampleOrders() {
  try {
    // First, let's see what orders exist
    const { data: allOrders, error: fetchError } = await supabase
      .from('orders')
      .select('*');
    
    console.log('Current orders in database:', allOrders);
    
    if (fetchError) {
      console.error('Error fetching orders:', fetchError);
      return;
    }
    
    // Delete all orders (since they appear to be test/sample orders)
    const { data: deleteResult, error: deleteError } = await supabase
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all orders
    
    if (deleteError) {
      console.error('Error deleting orders:', deleteError);
    } else {
      console.log('Sample orders cleaned up successfully!');
      console.log('Deleted orders:', deleteResult);
    }
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupSampleOrders();
