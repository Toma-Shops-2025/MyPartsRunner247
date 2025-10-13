// Script to remove the specific sample order
// Run this in your browser console on mypartsrunner.com

console.log('Removing sample order: d21db680-6360-460d-a7f6-43e571bb0c51');

async function removeSampleOrder() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .delete()
      .eq('id', 'd21db680-6360-460d-a7f6-43e571bb0c51');
    
    if (error) {
      console.error('Error deleting sample order:', error);
    } else {
      console.log('Sample order deleted successfully!');
      console.log('Deleted order:', data);
      alert('Sample order removed! Refresh the driver dashboard to see the changes.');
    }
  } catch (error) {
    console.error('Error during deletion:', error);
  }
}

removeSampleOrder();
