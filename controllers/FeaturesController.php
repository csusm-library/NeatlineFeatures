<?php

/**
 * @package Neatline
 **/

class NeatlineFeatures_FeaturesController extends Omeka_Controller_Action
{

	public function init()
	{
	}

	
	public function showAction()
	{
		$logger = Omeka_Context::getInstance()->getLogger();

		$id = (!$id) ? $this->getRequest()->getParam('id') : $id;
		$item = $this->findById($id,"Item");
		//$gml = $this->itemMetadata($item,'Dublin Core', 'Coverage');
		//$r = new ReflectionObject($item);
		//$mets = var_export($r->getMethods());
		$this->view->item = $item;
		//$this->view->gml = $gml;
	}
	
	public function libAction()
	{
		$id = (!$id) ? $this->getRequest()->getParam('id') : $id;
		$this->view->render("shared/javascripts/OpenLayers/" . $id);
	}
	


}