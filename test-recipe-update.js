const http = require('http');

async function testRecipeUpdate() {
  const baseUrl = 'http://localhost:8000/api';
  
  try {
    // First, get all recipes to find one to update
    console.log('Getting recipes...');
    const recipesResponse = await fetch(`${baseUrl}/recipes`);
    
    if (!recipesResponse.ok) {
      console.error('Failed to get recipes:', recipesResponse.status, recipesResponse.statusText);
      return;
    }
    
    const recipesResult = await recipesResponse.json();
    console.log('Recipes result:', recipesResult.success);
    
    if (!recipesResult.success || !recipesResult.data || recipesResult.data.length === 0) {
      console.log('No recipes found to test with');
      return;
    }
    
    const recipe = recipesResult.data[0];
    console.log('Testing with recipe:', recipe.name, recipe.id);
    
    // Create a test update with imageUrl and overheadPercentage
    const updateData = {
      name: recipe.name,
      description: recipe.description || 'Updated description',
      categoryId: recipe.categoryId,
      yieldQuantity: recipe.yieldQuantity,
      yieldUnit: recipe.yieldUnit,
      prepTime: recipe.prepTime || 0,
      cookTime: recipe.cookTime || 0,
      difficulty: recipe.difficulty || 'MEDIUM',
      emoji: recipe.emoji || '🍞',
      instructions: recipe.instructions || [],
      ingredients: recipe.ingredients ? recipe.ingredients.map(ing => ({
        ingredientType: ing.rawMaterialId ? 'RAW' : 'FINISHED',
        ingredientId: ing.rawMaterialId || ing.finishedProductId,
        quantity: ing.quantity,
        unit: ing.unit,
        notes: ing.notes
      })) : [],
      isActive: recipe.isActive,
      estimatedTotalTime: recipe.estimatedTotalTime,
      // New fields
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', // Small base64 image
      overheadPercentage: 25
    };
    
    console.log('Updating recipe with data:', {
      ...updateData,
      imageUrl: `[base64 image data - ${updateData.imageUrl.length} chars]`
    });
    
    // Update the recipe
    const updateResponse = await fetch(`${baseUrl}/recipes/${recipe.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });
    
    console.log('Update response status:', updateResponse.status);
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update recipe:', updateResponse.status, updateResponse.statusText);
      console.error('Error details:', errorText);
      return;
    }
    
    const updateResult = await updateResponse.json();
    console.log('Update successful:', updateResult.success);
    
    if (updateResult.success) {
      console.log('Updated recipe data:');
      console.log('- Name:', updateResult.data.name);
      console.log('- Image URL:', updateResult.data.imageUrl ? 'Present' : 'Missing');
      console.log('- Overhead %:', updateResult.data.overheadPercentage);
    }
    
  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

testRecipeUpdate();